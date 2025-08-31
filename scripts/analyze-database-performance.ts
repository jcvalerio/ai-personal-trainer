#!/usr/bin/env tsx
/**
 * Database Performance Analysis Script
 * Analyzes query performance, index usage, and provides optimization recommendations
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { optimizedDb, checkOptimizedDbHealth, getDbHealth } from '../lib/db/optimized-connection';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface QueryPerformanceResult {
  query: string;
  avgDuration: number;
  executionCount: number;
  totalDuration: number;
  percentOfTotal: number;
}

interface IndexUsageResult {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
  usage_ratio: number;
}

interface TableStatsResult {
  tablename: string;
  row_count: number;
  table_size: string;
  index_size: string;
  total_size: string;
  seq_scan: number;
  seq_tup_read: number;
  idx_scan: number;
  idx_tup_fetch: number;
}

class DatabasePerformanceAnalyzer {
  /**
   * Analyze slow queries and performance bottlenecks
   */
  private async analyzeQueryPerformance(): Promise<QueryPerformanceResult[]> {
    try {
      console.log('📊 Analyzing query performance...');
      
      // Enable pg_stat_statements if available (this would be done by DBA in production)
      const extensionCheck = await optimizedDb.executeQuery(`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
        ) as has_pg_stat_statements
      `);
      
      if (!extensionCheck[0]?.has_pg_stat_statements) {
        console.log('⚠️  pg_stat_statements not available - using alternative analysis');
        return this.alternativeQueryAnalysis();
      }
      
      const queryStats = await optimizedDb.executeQuery<any>(`
        SELECT 
          query,
          calls as execution_count,
          total_exec_time as total_duration,
          mean_exec_time as avg_duration,
          (total_exec_time / sum(total_exec_time) OVER()) * 100 as percent_of_total
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY total_exec_time DESC
        LIMIT 10
      `);
      
      return queryStats.map(row => ({
        query: row.query.substring(0, 100) + '...',
        avgDuration: parseFloat(row.avg_duration || 0),
        executionCount: parseInt(row.execution_count || 0),
        totalDuration: parseFloat(row.total_duration || 0),
        percentOfTotal: parseFloat(row.percent_of_total || 0),
      }));
    } catch (error) {
      console.log('⚠️  Standard query analysis failed, using alternative method');
      return this.alternativeQueryAnalysis();
    }
  }

  /**
   * Alternative query analysis when pg_stat_statements is not available
   */
  private async alternativeQueryAnalysis(): Promise<QueryPerformanceResult[]> {
    const testQueries = [
      {
        name: 'User Profile Lookup',
        query: 'SELECT id FROM user_profiles WHERE clerk_user_id = $1',
        testParams: ['test-user-id'],
      },
      {
        name: 'Session Retrieval',
        query: `
          SELECT ws.*, up.display_name 
          FROM workout_sessions ws
          JOIN user_profiles up ON ws.user_id = up.id
          WHERE ws.id = $1 AND ws.is_active = true
        `,
        testParams: ['00000000-0000-0000-0000-000000000000'],
      },
      {
        name: 'Session List Query',
        query: `
          SELECT ws.id, ws.name, ws.status, ws.scheduled_date
          FROM workout_sessions ws
          JOIN user_profiles up ON ws.user_id = up.id
          WHERE up.clerk_user_id = $1 AND ws.is_active = true
          ORDER BY ws.scheduled_date DESC LIMIT 10
        `,
        testParams: ['test-user-id'],
      },
      {
        name: 'Exercise Search',
        query: `
          SELECT id, name, primary_muscle_groups
          FROM exercise_library
          WHERE is_active = true
          ORDER BY name
          LIMIT 20
        `,
        testParams: [],
      },
    ];

    const results: QueryPerformanceResult[] = [];
    
    for (const test of testQueries) {
      const iterations = 5;
      let totalDuration = 0;
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        try {
          await optimizedDb.executeQuery(test.query, test.testParams, { 
            cacheable: false,
            timeout: 5000 
          });
        } catch (error) {
          // Query might fail due to missing data, but we still measure timing
        }
        totalDuration += Date.now() - startTime;
      }
      
      results.push({
        query: test.name,
        avgDuration: totalDuration / iterations,
        executionCount: iterations,
        totalDuration,
        percentOfTotal: 0, // Will calculate after all queries
      });
    }
    
    // Calculate percentage of total
    const grandTotal = results.reduce((sum, r) => sum + r.totalDuration, 0);
    results.forEach(r => {
      r.percentOfTotal = (r.totalDuration / grandTotal) * 100;
    });
    
    return results.sort((a, b) => b.totalDuration - a.totalDuration);
  }

  /**
   * Analyze index usage and effectiveness
   */
  private async analyzeIndexUsage(): Promise<IndexUsageResult[]> {
    try {
      console.log('📊 Analyzing index usage...');
      
      const indexStats = await optimizedDb.executeQuery<any>(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          CASE 
            WHEN idx_scan = 0 THEN 0
            ELSE round((idx_tup_fetch::numeric / idx_tup_read::numeric) * 100, 2)
          END as usage_ratio
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC, usage_ratio DESC
      `);
      
      return indexStats.map(row => ({
        schemaname: row.schemaname,
        tablename: row.tablename,
        indexname: row.indexname,
        idx_scan: parseInt(row.idx_scan || 0),
        idx_tup_read: parseInt(row.idx_tup_read || 0),
        idx_tup_fetch: parseInt(row.idx_tup_fetch || 0),
        usage_ratio: parseFloat(row.usage_ratio || 0),
      }));
    } catch (error) {
      console.log('⚠️  Index analysis failed:', error);
      return [];
    }
  }

  /**
   * Analyze table statistics and sizes
   */
  private async analyzeTableStats(): Promise<TableStatsResult[]> {
    try {
      console.log('📊 Analyzing table statistics...');
      
      const tableStats = await optimizedDb.executeQuery<any>(`
        SELECT 
          t.tablename,
          t.n_tup_ins + t.n_tup_upd + t.n_tup_del as row_count,
          pg_size_pretty(pg_relation_size(c.oid)) as table_size,
          pg_size_pretty(pg_indexes_size(c.oid)) as index_size,
          pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
          t.seq_scan,
          t.seq_tup_read,
          t.idx_scan,
          t.idx_tup_fetch
        FROM pg_stat_user_tables t
        JOIN pg_class c ON t.relname = c.relname
        WHERE t.schemaname = 'public'
        ORDER BY pg_total_relation_size(c.oid) DESC
      `);
      
      return tableStats.map(row => ({
        tablename: row.tablename,
        row_count: parseInt(row.row_count || 0),
        table_size: row.table_size,
        index_size: row.index_size,
        total_size: row.total_size,
        seq_scan: parseInt(row.seq_scan || 0),
        seq_tup_read: parseInt(row.seq_tup_read || 0),
        idx_scan: parseInt(row.idx_scan || 0),
        idx_tup_fetch: parseInt(row.idx_tup_fetch || 0),
      }));
    } catch (error) {
      console.log('⚠️  Table statistics analysis failed:', error);
      return [];
    }
  }

  /**
   * Check for missing indexes on frequently queried columns
   */
  private async analyzeMissingIndexes(): Promise<string[]> {
    try {
      console.log('🔍 Checking for missing indexes...');
      
      const recommendations: string[] = [];
      
      // Check for large table sequential scans
      const seqScans = await optimizedDb.executeQuery<any>(`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          n_tup_ins + n_tup_upd + n_tup_del as total_rows
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
          AND seq_scan > 100
          AND (n_tup_ins + n_tup_upd + n_tup_del) > 1000
        ORDER BY seq_scan DESC
      `);
      
      seqScans.forEach(row => {
        const ratio = row.seq_scan / (row.idx_scan || 1);
        if (ratio > 10) {
          recommendations.push(
            `Table '${row.tablename}' has high sequential scan ratio (${ratio.toFixed(1)}:1). Consider adding indexes on frequently queried columns.`
          );
        }
      });
      
      // Check for unused indexes
      const unusedIndexes = await optimizedDb.executeQuery<any>(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND idx_scan < 10
          AND indexname NOT LIKE '%_pkey'
        ORDER BY idx_scan
      `);
      
      unusedIndexes.forEach(row => {
        recommendations.push(
          `Index '${row.indexname}' on table '${row.tablename}' is rarely used (${row.idx_scan} scans). Consider dropping if not needed.`
        );
      });
      
      return recommendations;
    } catch (error) {
      console.log('⚠️  Missing index analysis failed:', error);
      return [];
    }
  }

  /**
   * Generate performance optimization recommendations
   */
  private generateOptimizationRecommendations(
    queryPerf: QueryPerformanceResult[],
    indexUsage: IndexUsageResult[],
    tableStats: TableStatsResult[],
    missingIndexes: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Query performance recommendations
    const slowQueries = queryPerf.filter(q => q.avgDuration > 100);
    if (slowQueries.length > 0) {
      recommendations.push(
        `🐌 Found ${slowQueries.length} slow queries (>100ms average). Consider optimizing with better indexes or query restructuring.`
      );
    }
    
    // Index usage recommendations
    const unusedIndexes = indexUsage.filter(i => i.idx_scan < 10);
    if (unusedIndexes.length > 0) {
      recommendations.push(
        `🗑️  Found ${unusedIndexes.length} rarely used indexes. Consider dropping unused indexes to improve write performance.`
      );
    }
    
    const highUsageIndexes = indexUsage.filter(i => i.idx_scan > 1000);
    if (highUsageIndexes.length > 0) {
      recommendations.push(
        `✅ Found ${highUsageIndexes.length} heavily used indexes. These are performing well and should be maintained.`
      );
    }
    
    // Table size recommendations
    const largeTables = tableStats.filter(t => t.row_count > 10000);
    if (largeTables.length > 0) {
      recommendations.push(
        `📊 Found ${largeTables.length} large tables. Consider partitioning or archiving strategies for tables with >100K rows.`
      );
    }
    
    // Sequential scan recommendations
    const highSeqScan = tableStats.filter(t => t.seq_scan > t.idx_scan * 2);
    if (highSeqScan.length > 0) {
      recommendations.push(
        `🔍 Found ${highSeqScan.length} tables with high sequential scan ratios. Add indexes on commonly filtered columns.`
      );
    }
    
    // Add missing index recommendations
    recommendations.push(...missingIndexes);
    
    // Connection pooling recommendations
    recommendations.push(
      `🔗 Use connection pooling with optimal settings: max_connections=50, idle_timeout=60s for production.`
    );
    
    // Caching recommendations
    recommendations.push(
      `⚡ Implement query result caching for read-heavy operations with 5-minute TTL.`
    );
    
    return recommendations;
  }

  /**
   * Run complete performance analysis
   */
  public async runAnalysis(): Promise<void> {
    console.log('🚀 Starting Database Performance Analysis\n');
    
    // Check connection health first
    console.log('📊 Checking database connection health...');
    const healthCheck = await checkOptimizedDbHealth();
    
    if (!healthCheck.isHealthy) {
      console.error('❌ Database connection unhealthy, aborting analysis');
      process.exit(1);
    }
    
    console.log(`✅ Database connection healthy (${healthCheck.latency}ms)\n`);
    
    // Get current metrics
    const currentMetrics = getDbHealth();
    console.log('📊 Current Performance Metrics:');
    console.log(`   Total Queries: ${currentMetrics.totalQueries}`);
    console.log(`   Cache Hit Rate: ${currentMetrics.cacheHitRate.toFixed(1)}%`);
    console.log(`   Average Query Time: ${currentMetrics.avgQueryTime.toFixed(1)}ms`);
    console.log(`   Slow Query Rate: ${currentMetrics.slowQueryRate.toFixed(1)}%`);
    console.log(`   Connection Errors: ${currentMetrics.connectionErrors}\n`);
    
    try {
      // Run all analyses
      const [queryPerf, indexUsage, tableStats, missingIndexes] = await Promise.all([
        this.analyzeQueryPerformance(),
        this.analyzeIndexUsage(),
        this.analyzeTableStats(),
        this.analyzeMissingIndexes(),
      ]);
      
      // Display results
      console.log('📊 Query Performance Analysis:');
      console.log('   Top queries by total execution time:');
      queryPerf.slice(0, 5).forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.query}`);
        console.log(`      Avg: ${q.avgDuration.toFixed(1)}ms, Executions: ${q.executionCount}, Total: ${q.totalDuration.toFixed(0)}ms`);
      });
      console.log('');
      
      console.log('📊 Index Usage Analysis:');
      console.log('   Most used indexes:');
      indexUsage.slice(0, 5).forEach((idx, i) => {
        console.log(`   ${i + 1}. ${idx.tablename}.${idx.indexname}`);
        console.log(`      Scans: ${idx.idx_scan}, Efficiency: ${idx.usage_ratio.toFixed(1)}%`);
      });
      console.log('');
      
      console.log('📊 Table Statistics:');
      console.log('   Largest tables by size:');
      tableStats.slice(0, 5).forEach((table, i) => {
        console.log(`   ${i + 1}. ${table.tablename}`);
        console.log(`      Size: ${table.total_size}, Rows: ${table.row_count}, Seq/Idx Ratio: ${(table.seq_scan / (table.idx_scan || 1)).toFixed(1)}`);
      });
      console.log('');
      
      // Generate recommendations
      const recommendations = this.generateOptimizationRecommendations(
        queryPerf,
        indexUsage,
        tableStats,
        missingIndexes
      );
      
      console.log('🎯 Optimization Recommendations:');
      recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
      console.log('');
      
      // Performance score calculation
      const perfScore = this.calculatePerformanceScore(currentMetrics, queryPerf, indexUsage, tableStats);
      console.log('📊 Overall Performance Score:');
      console.log(`   Score: ${perfScore.score}/100 (${perfScore.grade})`);
      console.log(`   ${perfScore.description}`);
      
      if (perfScore.score < 70) {
        console.log('\n⚠️  Performance improvements recommended!');
        console.log('   Run: pnpm db:setup to apply optimized schema with performance indexes');
      }
      
    } catch (error) {
      console.error('💥 Analysis failed:', error);
      process.exit(1);
    }
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(
    metrics: ReturnType<typeof getDbHealth>,
    queryPerf: QueryPerformanceResult[],
    indexUsage: IndexUsageResult[],
    tableStats: TableStatsResult[]
  ): { score: number; grade: string; description: string } {
    let score = 100;
    
    // Deduct for slow queries
    const slowQueries = queryPerf.filter(q => q.avgDuration > 100).length;
    score -= slowQueries * 5;
    
    // Deduct for poor cache hit rate
    if (metrics.cacheHitRate < 80) {
      score -= (80 - metrics.cacheHitRate) * 0.5;
    }
    
    // Deduct for high average query time
    if (metrics.avgQueryTime > 50) {
      score -= (metrics.avgQueryTime - 50) * 0.2;
    }
    
    // Deduct for unused indexes
    const unusedIndexes = indexUsage.filter(i => i.idx_scan < 10).length;
    score -= unusedIndexes * 2;
    
    // Deduct for high sequential scan ratios
    const highSeqScan = tableStats.filter(t => t.seq_scan > t.idx_scan * 3).length;
    score -= highSeqScan * 10;
    
    score = Math.max(0, Math.min(100, score));
    
    let grade: string;
    let description: string;
    
    if (score >= 90) {
      grade = 'A+';
      description = 'Excellent performance, well optimized';
    } else if (score >= 80) {
      grade = 'A';
      description = 'Good performance, minor optimizations possible';
    } else if (score >= 70) {
      grade = 'B';
      description = 'Acceptable performance, some optimizations recommended';
    } else if (score >= 60) {
      grade = 'C';
      description = 'Below average performance, optimizations needed';
    } else {
      grade = 'D';
      description = 'Poor performance, immediate optimizations required';
    }
    
    return { score: Math.round(score), grade, description };
  }
}

// Run analysis if this script is executed directly
if (require.main === module) {
  const analyzer = new DatabasePerformanceAnalyzer();
  analyzer.runAnalysis().catch((error) => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  });
}

export default DatabasePerformanceAnalyzer;