/**
 * Progress Analytics Type Definitions
 * Phase 3: Analytics data structures, chart configuration interfaces,
 * goal tracking and achievement system, and time-series data for progress visualization
 */

import { FitnessLevel } from './index';
import {
  MeasurementType,
  AchievementType,
  ExerciseType,
  SessionStatus,
  WorkoutStatus,
} from './workouts';
import { UserAchievement, ProgressMeasurement } from './workouts';

// ================================
// Core Analytics Types
// ================================

/**
 * Analytics Time Period
 */
export type AnalyticsPeriod =
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'custom'
  | 'all_time';

/**
 * Analytics Granularity
 */
export type AnalyticsGranularity =
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

/**
 * Analytics Metric Types
 */
export type MetricType =
  | 'count' // Simple count
  | 'sum' // Sum of values
  | 'average' // Average value
  | 'median' // Median value
  | 'percentage' // Percentage value
  | 'rate' // Rate of change
  | 'ratio' // Ratio between values
  | 'distribution' // Distribution analysis
  | 'trend'; // Trend analysis

/**
 * Data Aggregation Methods
 */
export type AggregationMethod =
  | 'sum'
  | 'average'
  | 'median'
  | 'min'
  | 'max'
  | 'count'
  | 'distinct_count'
  | 'percentile'
  | 'standard_deviation';

/**
 * Trend Direction
 */
export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile' | 'unknown';

/**
 * Analytics Date Range
 */
export interface AnalyticsDateRange {
  /** Start date */
  startDate: Date;
  /** End date */
  endDate: Date;
  /** Period type */
  period: AnalyticsPeriod;
  /** Custom label */
  label?: string;
  /** Comparison period */
  comparisonPeriod?: AnalyticsDateRange;
}

// ================================
// Progress Analytics Core
// ================================

/**
 * Progress Analytics Dashboard
 */
export interface ProgressAnalyticsDashboard {
  /** Dashboard configuration */
  config: AnalyticsDashboardConfig;
  /** Analytics widgets */
  widgets: AnalyticsWidget[];
  /** Dashboard data */
  data: ProgressAnalyticsData;
  /** Dashboard state */
  state: AnalyticsDashboardState;
  /** Export options */
  export: AnalyticsExportOptions;
}

/**
 * Analytics Dashboard Configuration
 */
export interface AnalyticsDashboardConfig {
  /** Dashboard ID */
  id: string;
  /** Dashboard name */
  name: string;
  /** Dashboard description */
  description?: string;
  /** Default date range */
  defaultDateRange: AnalyticsDateRange;
  /** Refresh interval (minutes) */
  refreshInterval: number;
  /** Auto-refresh enabled */
  autoRefresh: boolean;
  /** Dashboard layout */
  layout: DashboardLayout;
  /** Personalization settings */
  personalization: PersonalizationSettings;
}

/**
 * Dashboard Layout Configuration
 */
export interface DashboardLayout {
  /** Layout type */
  type: 'grid' | 'flexible' | 'tabbed';
  /** Number of columns */
  columns: number;
  /** Row height */
  rowHeight: number;
  /** Widget spacing */
  spacing: number;
  /** Responsive breakpoints */
  breakpoints: ResponsiveBreakpoint[];
}

/**
 * Responsive Breakpoint
 */
export interface ResponsiveBreakpoint {
  /** Breakpoint name */
  name: string;
  /** Minimum width */
  minWidth: number;
  /** Number of columns at this breakpoint */
  columns: number;
  /** Widget adjustments */
  widgetAdjustments: WidgetAdjustment[];
}

/**
 * Widget Adjustment
 */
export interface WidgetAdjustment {
  /** Widget ID */
  widgetId: string;
  /** New size */
  size: WidgetSize;
  /** New position */
  position?: WidgetPosition;
  /** Hide widget at this breakpoint */
  hidden?: boolean;
}

/**
 * Personalization Settings
 */
export interface PersonalizationSettings {
  /** User preferences */
  userPreferences: UserAnalyticsPreferences;
  /** Customizable widgets */
  customizableWidgets: boolean;
  /** Save custom layouts */
  saveCustomLayouts: boolean;
  /** Widget recommendations */
  widgetRecommendations: boolean;
}

/**
 * User Analytics Preferences
 */
export interface UserAnalyticsPreferences {
  /** Preferred metrics */
  preferredMetrics: string[];
  /** Preferred chart types */
  preferredChartTypes: ChartType[];
  /** Color scheme */
  colorScheme: 'light' | 'dark' | 'auto';
  /** Animation preferences */
  animations: boolean;
  /** Notification preferences */
  notifications: AnalyticsNotificationSettings;
}

/**
 * Analytics Notification Settings
 */
export interface AnalyticsNotificationSettings {
  /** Goal achievement notifications */
  goalAchievements: boolean;
  /** Milestone notifications */
  milestones: boolean;
  /** Trend alerts */
  trendAlerts: boolean;
  /** Performance alerts */
  performanceAlerts: boolean;
  /** Weekly/monthly summaries */
  summaries: boolean;
}

/**
 * Analytics Widget
 */
export interface AnalyticsWidget {
  /** Widget ID */
  id: string;
  /** Widget type */
  type: AnalyticsWidgetType;
  /** Widget title */
  title: string;
  /** Widget description */
  description?: string;
  /** Widget configuration */
  config: WidgetConfig;
  /** Widget data */
  data: WidgetData;
  /** Widget position */
  position: WidgetPosition;
  /** Widget size */
  size: WidgetSize;
  /** Widget state */
  state: WidgetState;
}

/**
 * Analytics Widget Types
 */
export type AnalyticsWidgetType =
  | 'metric_card' // Simple metric display
  | 'progress_chart' // Progress over time
  | 'goal_tracker' // Goal progress tracking
  | 'achievement_list' // Recent achievements
  | 'body_metrics' // Body measurement tracking
  | 'workout_heatmap' // Workout frequency heatmap
  | 'strength_progression' // Strength gains over time
  | 'consistency_tracker' // Workout consistency
  | 'nutrition_overview' // Nutrition tracking
  | 'sleep_analysis' // Sleep pattern analysis
  | 'comparison_chart' // Period comparisons
  | 'leaderboard' // Social comparisons
  | 'insights_panel' // AI-generated insights
  | 'custom_metric'; // User-defined metrics

/**
 * Widget Configuration
 */
export interface WidgetConfig {
  /** Data source configuration */
  dataSource: DataSourceConfig;
  /** Display configuration */
  display: WidgetDisplayConfig;
  /** Interaction configuration */
  interaction: WidgetInteractionConfig;
  /** Refresh configuration */
  refresh: WidgetRefreshConfig;
}

/**
 * Data Source Configuration
 */
export interface DataSourceConfig {
  /** Primary data source */
  primary: DataSource;
  /** Secondary data sources */
  secondary?: DataSource[];
  /** Data filters */
  filters: DataFilter[];
  /** Data aggregation */
  aggregation: DataAggregation;
  /** Data transformation */
  transformation?: DataTransformation[];
}

/**
 * Data Source
 */
export interface DataSource {
  /** Source type */
  type: DataSourceType;
  /** Source identifier */
  id: string;
  /** Source parameters */
  parameters: Record<string, any>;
  /** Cache configuration */
  cache: CacheConfiguration;
}

/**
 * Data Source Types
 */
export type DataSourceType =
  | 'workout_sessions'
  | 'progress_measurements'
  | 'achievements'
  | 'body_metrics'
  | 'exercise_performance'
  | 'nutrition_data'
  | 'sleep_data'
  | 'heart_rate_data'
  | 'custom_metrics'
  | 'social_data';

/**
 * Cache Configuration
 */
export interface CacheConfiguration {
  /** Cache enabled */
  enabled: boolean;
  /** Cache duration (minutes) */
  duration: number;
  /** Cache invalidation strategy */
  invalidation: 'time_based' | 'event_based' | 'manual';
}

/**
 * Data Filter
 */
export interface DataFilter {
  /** Filter field */
  field: string;
  /** Filter operator */
  operator: FilterOperator;
  /** Filter value */
  value: any;
  /** Filter condition */
  condition?: 'and' | 'or';
}

/**
 * Filter Operators
 */
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'between'
  | 'is_null'
  | 'is_not_null';

/**
 * Data Aggregation
 */
export interface DataAggregation {
  /** Aggregation method */
  method: AggregationMethod;
  /** Group by fields */
  groupBy: string[];
  /** Having conditions */
  having?: DataFilter[];
  /** Time bucket */
  timeBucket?: TimeBucket;
}

/**
 * Time Bucket Configuration
 */
export interface TimeBucket {
  /** Bucket size */
  size: number;
  /** Bucket unit */
  unit: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  /** Bucket alignment */
  alignment: 'start' | 'end' | 'center';
}

/**
 * Data Transformation
 */
export interface DataTransformation {
  /** Transformation type */
  type: TransformationType;
  /** Transformation parameters */
  parameters: Record<string, any>;
  /** Output field name */
  outputField?: string;
}

/**
 * Transformation Types
 */
export type TransformationType =
  | 'calculate_field' // Calculate new field
  | 'normalize' // Normalize values
  | 'moving_average' // Calculate moving average
  | 'percent_change' // Calculate percentage change
  | 'cumulative_sum' // Calculate cumulative sum
  | 'ranking' // Rank values
  | 'binning' // Bin continuous values
  | 'pivot' // Pivot table transformation
  | 'unpivot'; // Unpivot table transformation

/**
 * Widget Display Configuration
 */
export interface WidgetDisplayConfig {
  /** Chart configuration */
  chart: ChartConfiguration;
  /** Color scheme */
  colors: ColorScheme;
  /** Typography settings */
  typography: TypographySettings;
  /** Spacing settings */
  spacing: SpacingSettings;
  /** Animation settings */
  animations: AnimationSettings;
}

/**
 * Widget Interaction Configuration
 */
export interface WidgetInteractionConfig {
  /** Click interactions */
  onClick?: InteractionHandler;
  /** Hover interactions */
  onHover?: InteractionHandler;
  /** Drill-down enabled */
  drillDown: boolean;
  /** Export enabled */
  exportEnabled: boolean;
  /** Zoom enabled */
  zoomEnabled: boolean;
  /** Cross-filtering enabled */
  crossFilterEnabled: boolean;
}

/**
 * Interaction Handler
 */
export interface InteractionHandler {
  /** Handler type */
  type: 'navigate' | 'filter' | 'modal' | 'tooltip' | 'custom';
  /** Handler configuration */
  config: Record<string, any>;
}

/**
 * Widget Refresh Configuration
 */
export interface WidgetRefreshConfig {
  /** Auto-refresh enabled */
  autoRefresh: boolean;
  /** Refresh interval (seconds) */
  interval: number;
  /** Refresh on data change */
  refreshOnDataChange: boolean;
  /** Manual refresh enabled */
  manualRefresh: boolean;
}

/**
 * Widget Data
 */
export interface WidgetData {
  /** Raw data */
  raw: any[];
  /** Processed data */
  processed: ProcessedData;
  /** Data metadata */
  metadata: DataMetadata;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error?: string;
  /** Last updated */
  lastUpdated: Date;
}

/**
 * Processed Data
 */
export interface ProcessedData {
  /** Chart data */
  chartData: ChartData;
  /** Summary statistics */
  summary: SummaryStatistics;
  /** Trend analysis */
  trends: TrendAnalysis;
  /** Insights */
  insights: DataInsight[];
}

/**
 * Data Metadata
 */
export interface DataMetadata {
  /** Data source information */
  source: DataSourceMetadata;
  /** Data quality metrics */
  quality: DataQualityMetrics;
  /** Data freshness */
  freshness: DataFreshnessInfo;
  /** Data lineage */
  lineage: DataLineage[];
}

/**
 * Data Source Metadata
 */
export interface DataSourceMetadata {
  /** Source name */
  name: string;
  /** Source type */
  type: DataSourceType;
  /** Record count */
  recordCount: number;
  /** Date range */
  dateRange: AnalyticsDateRange;
  /** Field information */
  fields: FieldMetadata[];
}

/**
 * Field Metadata
 */
export interface FieldMetadata {
  /** Field name */
  name: string;
  /** Field type */
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  /** Field description */
  description?: string;
  /** Field format */
  format?: string;
  /** Null percentage */
  nullPercentage: number;
  /** Unique values count */
  uniqueValues: number;
}

/**
 * Data Quality Metrics
 */
export interface DataQualityMetrics {
  /** Completeness score (0-100) */
  completeness: number;
  /** Accuracy score (0-100) */
  accuracy: number;
  /** Consistency score (0-100) */
  consistency: number;
  /** Timeliness score (0-100) */
  timeliness: number;
  /** Quality issues */
  issues: DataQualityIssue[];
}

/**
 * Data Quality Issue
 */
export interface DataQualityIssue {
  /** Issue type */
  type:
    | 'missing_values'
    | 'outliers'
    | 'duplicates'
    | 'format_errors'
    | 'inconsistency';
  /** Issue description */
  description: string;
  /** Affected records */
  affectedRecords: number;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Data Freshness Information
 */
export interface DataFreshnessInfo {
  /** Last update timestamp */
  lastUpdate: Date;
  /** Update frequency */
  updateFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  /** Data latency (minutes) */
  latency: number;
  /** Staleness indicator */
  isStale: boolean;
}

/**
 * Data Lineage
 */
export interface DataLineage {
  /** Source system */
  source: string;
  /** Transformation steps */
  transformations: string[];
  /** Target system */
  target: string;
  /** Lineage timestamp */
  timestamp: Date;
}

/**
 * Widget Position
 */
export interface WidgetPosition {
  /** X coordinate (grid units) */
  x: number;
  /** Y coordinate (grid units) */
  y: number;
  /** Z-index */
  z?: number;
}

/**
 * Widget Size
 */
export interface WidgetSize {
  /** Width (grid units) */
  width: number;
  /** Height (grid units) */
  height: number;
  /** Minimum width */
  minWidth?: number;
  /** Minimum height */
  minHeight?: number;
  /** Maximum width */
  maxWidth?: number;
  /** Maximum height */
  maxHeight?: number;
}

/**
 * Widget State
 */
export interface WidgetState {
  /** Is widget expanded */
  expanded: boolean;
  /** Is widget minimized */
  minimized: boolean;
  /** Is widget loading */
  loading: boolean;
  /** Widget error */
  error?: string;
  /** Widget selected */
  selected: boolean;
  /** Edit mode */
  editMode: boolean;
}

/**
 * Progress Analytics Data
 */
export interface ProgressAnalyticsData {
  /** Fitness metrics */
  fitness: FitnessAnalytics;
  /** Body composition metrics */
  bodyComposition: BodyCompositionAnalytics;
  /** Performance metrics */
  performance: PerformanceAnalytics;
  /** Consistency metrics */
  consistency: ConsistencyAnalytics;
  /** Goal tracking data */
  goals: GoalTrackingData;
  /** Achievement data */
  achievements: AchievementAnalytics;
  /** Comparative data */
  comparisons: ComparativeAnalytics;
  /** Predictive data */
  predictions: PredictiveAnalytics;
}

/**
 * Analytics Dashboard State
 */
export interface AnalyticsDashboardState {
  /** Current date range */
  dateRange: AnalyticsDateRange;
  /** Active filters */
  filters: AnalyticsFilter[];
  /** View state */
  view: DashboardViewState;
  /** Loading states */
  loading: DashboardLoadingState;
  /** Error states */
  errors: DashboardErrorState;
  /** User interactions */
  interactions: DashboardInteractionState;
}

/**
 * Dashboard View State
 */
export interface DashboardViewState {
  /** Current tab/section */
  activeSection: string;
  /** Zoom level */
  zoomLevel: number;
  /** Full-screen widget */
  fullScreenWidget?: string;
  /** Widget visibility */
  widgetVisibility: Record<string, boolean>;
  /** Layout mode */
  layoutMode: 'view' | 'edit' | 'customize';
}

/**
 * Dashboard Loading State
 */
export interface DashboardLoadingState {
  /** Overall loading */
  overall: boolean;
  /** Widget loading states */
  widgets: Record<string, boolean>;
  /** Data loading states */
  data: Record<string, boolean>;
}

/**
 * Dashboard Error State
 */
export interface DashboardErrorState {
  /** Global errors */
  global: string[];
  /** Widget errors */
  widgets: Record<string, string>;
  /** Data errors */
  data: Record<string, string>;
}

/**
 * Dashboard Interaction State
 */
export interface DashboardInteractionState {
  /** Selected widgets */
  selectedWidgets: Set<string>;
  /** Cross-filter state */
  crossFilters: CrossFilter[];
  /** Drill-down state */
  drillDown: DrillDownState[];
  /** Hover state */
  hover: HoverState;
}

/**
 * Cross Filter
 */
export interface CrossFilter {
  /** Filter ID */
  id: string;
  /** Source widget */
  sourceWidget: string;
  /** Target widgets */
  targetWidgets: string[];
  /** Filter criteria */
  criteria: DataFilter[];
  /** Filter active */
  active: boolean;
}

/**
 * Drill-Down State
 */
export interface DrillDownState {
  /** Widget ID */
  widgetId: string;
  /** Current drill level */
  level: number;
  /** Drill path */
  path: DrillDownLevel[];
  /** Can drill further */
  canDrillDown: boolean;
  /** Can drill up */
  canDrillUp: boolean;
}

/**
 * Drill-Down Level
 */
export interface DrillDownLevel {
  /** Level name */
  name: string;
  /** Level value */
  value: any;
  /** Level filters */
  filters: DataFilter[];
}

/**
 * Hover State
 */
export interface HoverState {
  /** Hovered widget */
  widget?: string;
  /** Hovered data point */
  dataPoint?: any;
  /** Hover position */
  position: { x: number; y: number };
  /** Tooltip content */
  tooltipContent?: string;
}

/**
 * Analytics Export Options
 */
export interface AnalyticsExportOptions {
  /** Available formats */
  formats: ExportFormat[];
  /** Export templates */
  templates: ExportTemplate[];
  /** Scheduled exports */
  scheduledExports: ScheduledExport[];
  /** Export history */
  history: ExportHistoryEntry[];
}

/**
 * Export Format
 */
export interface ExportFormat {
  /** Format type */
  type: 'pdf' | 'excel' | 'csv' | 'png' | 'svg' | 'json' | 'html';
  /** Format name */
  name: string;
  /** Format description */
  description: string;
  /** Format options */
  options: ExportFormatOptions;
  /** Format size limits */
  sizeLimits: ExportSizeLimits;
}

/**
 * Export Format Options
 */
export interface ExportFormatOptions {
  /** Include charts */
  includeCharts: boolean;
  /** Include data */
  includeData: boolean;
  /** Include metadata */
  includeMetadata: boolean;
  /** Compression */
  compression?: CompressionOptions;
}

/**
 * Compression Options
 */
export interface CompressionOptions {
  /** Compression enabled */
  enabled: boolean;
  /** Compression level (1-9) */
  level: number;
  /** Compression algorithm */
  algorithm: 'gzip' | 'deflate' | 'brotli';
}

/**
 * Export Size Limits
 */
export interface ExportSizeLimits {
  /** Maximum file size (MB) */
  maxFileSize: number;
  /** Maximum records */
  maxRecords: number;
  /** Maximum charts */
  maxCharts: number;
}

/**
 * Export Template
 */
export interface ExportTemplate {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template configuration */
  config: ExportTemplateConfig;
  /** Template preview */
  preview?: string;
}

/**
 * Export Template Configuration
 */
export interface ExportTemplateConfig {
  /** Include widgets */
  widgets: string[];
  /** Layout configuration */
  layout: ExportLayoutConfig;
  /** Style configuration */
  style: ExportStyleConfig;
  /** Content configuration */
  content: ExportContentConfig;
}

/**
 * Export Layout Configuration
 */
export interface ExportLayoutConfig {
  /** Page orientation */
  orientation: 'portrait' | 'landscape';
  /** Page size */
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';
  /** Margins */
  margins: { top: number; right: number; bottom: number; left: number };
  /** Header configuration */
  header?: HeaderConfig;
  /** Footer configuration */
  footer?: FooterConfig;
}

/**
 * Header/Footer Configuration
 */
export interface HeaderConfig {
  /** Header content */
  content: string;
  /** Header height */
  height: number;
  /** Header style */
  style: TextStyle;
}

export interface FooterConfig {
  /** Footer content */
  content: string;
  /** Footer height */
  height: number;
  /** Footer style */
  style: TextStyle;
}

/**
 * Export Style Configuration
 */
export interface ExportStyleConfig {
  /** Color scheme */
  colorScheme: 'color' | 'grayscale' | 'black_white';
  /** Font family */
  fontFamily: string;
  /** Font sizes */
  fontSizes: FontSizeConfig;
  /** Brand colors */
  brandColors?: BrandColorConfig;
}

/**
 * Font Size Configuration
 */
export interface FontSizeConfig {
  /** Title font size */
  title: number;
  /** Heading font size */
  heading: number;
  /** Body font size */
  body: number;
  /** Caption font size */
  caption: number;
}

/**
 * Brand Color Configuration
 */
export interface BrandColorConfig {
  /** Primary brand color */
  primary: string;
  /** Secondary brand color */
  secondary: string;
  /** Accent color */
  accent: string;
}

/**
 * Export Content Configuration
 */
export interface ExportContentConfig {
  /** Include title page */
  titlePage: boolean;
  /** Include summary */
  summary: boolean;
  /** Include charts */
  charts: boolean;
  /** Include data tables */
  dataTables: boolean;
  /** Include insights */
  insights: boolean;
  /** Include appendix */
  appendix: boolean;
}

/**
 * Scheduled Export
 */
export interface ScheduledExport {
  /** Schedule ID */
  id: string;
  /** Schedule name */
  name: string;
  /** Export template */
  templateId: string;
  /** Export format */
  format: string;
  /** Schedule frequency */
  frequency: ScheduleFrequency;
  /** Schedule recipients */
  recipients: ExportRecipient[];
  /** Next execution */
  nextExecution: Date;
  /** Schedule active */
  active: boolean;
}

/**
 * Schedule Frequency
 */
export interface ScheduleFrequency {
  /** Frequency type */
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  /** Frequency value */
  value: number;
  /** Time of execution */
  time: string;
  /** Days of week (for weekly) */
  daysOfWeek?: number[];
  /** Day of month (for monthly) */
  dayOfMonth?: number;
}

/**
 * Export Recipient
 */
export interface ExportRecipient {
  /** Recipient type */
  type: 'email' | 'webhook' | 'storage';
  /** Recipient address */
  address: string;
  /** Recipient name */
  name?: string;
  /** Delivery options */
  options: DeliveryOptions;
}

/**
 * Delivery Options
 */
export interface DeliveryOptions {
  /** Delivery method */
  method: 'attachment' | 'link' | 'embed';
  /** Message subject */
  subject?: string;
  /** Message body */
  body?: string;
  /** Link expiration (days) */
  linkExpiration?: number;
}

/**
 * Export History Entry
 */
export interface ExportHistoryEntry {
  /** Export ID */
  id: string;
  /** Export timestamp */
  timestamp: Date;
  /** Export type */
  type: 'manual' | 'scheduled';
  /** Export format */
  format: string;
  /** Export status */
  status: 'success' | 'failed' | 'in_progress';
  /** File size */
  fileSize?: number;
  /** Download link */
  downloadLink?: string;
  /** Error message */
  error?: string;
}

// ================================
// Chart Configuration Types
// ================================

/**
 * Chart Configuration
 */
export interface ChartConfiguration {
  /** Chart type */
  type: ChartType;
  /** Chart options */
  options: ChartOptions;
  /** Chart data configuration */
  data: ChartDataConfig;
  /** Chart styling */
  style: ChartStyle;
  /** Chart interactions */
  interactions: ChartInteractions;
  /** Chart annotations */
  annotations?: ChartAnnotation[];
}

/**
 * Chart Types
 */
export type ChartType =
  | 'line' // Line chart
  | 'bar' // Bar chart
  | 'column' // Column chart
  | 'area' // Area chart
  | 'pie' // Pie chart
  | 'donut' // Donut chart
  | 'scatter' // Scatter plot
  | 'bubble' // Bubble chart
  | 'heatmap' // Heatmap
  | 'gauge' // Gauge chart
  | 'radar' // Radar/spider chart
  | 'treemap' // Treemap
  | 'sankey' // Sankey diagram
  | 'funnel' // Funnel chart
  | 'waterfall' // Waterfall chart
  | 'candlestick' // Candlestick chart
  | 'box_plot' // Box plot
  | 'histogram' // Histogram
  | 'density' // Density plot
  | 'timeline' // Timeline chart
  | 'gantt'; // Gantt chart

/**
 * Chart Options
 */
export interface ChartOptions {
  /** Chart title */
  title?: ChartTitle;
  /** Chart subtitle */
  subtitle?: ChartSubtitle;
  /** Chart legend */
  legend?: ChartLegend;
  /** Chart axes */
  axes?: ChartAxes;
  /** Chart grid */
  grid?: ChartGrid;
  /** Chart tooltip */
  tooltip?: ChartTooltip;
  /** Chart responsive settings */
  responsive?: ResponsiveSettings;
  /** Chart animation settings */
  animations?: ChartAnimations;
}

/**
 * Chart Title Configuration
 */
export interface ChartTitle {
  /** Title text */
  text: string;
  /** Title alignment */
  align: 'left' | 'center' | 'right';
  /** Title style */
  style: TextStyle;
  /** Title margin */
  margin: number;
}

/**
 * Chart Subtitle Configuration
 */
export interface ChartSubtitle {
  /** Subtitle text */
  text: string;
  /** Subtitle alignment */
  align: 'left' | 'center' | 'right';
  /** Subtitle style */
  style: TextStyle;
  /** Subtitle margin */
  margin: number;
}

/**
 * Text Style
 */
export interface TextStyle {
  /** Font family */
  fontFamily: string;
  /** Font size */
  fontSize: number;
  /** Font weight */
  fontWeight: 'normal' | 'bold' | number;
  /** Font style */
  fontStyle: 'normal' | 'italic';
  /** Text color */
  color: string;
  /** Text decoration */
  textDecoration?: 'none' | 'underline' | 'strikethrough';
}

/**
 * Chart Legend Configuration
 */
export interface ChartLegend {
  /** Legend enabled */
  enabled: boolean;
  /** Legend position */
  position: 'top' | 'bottom' | 'left' | 'right' | 'floating';
  /** Legend alignment */
  align: 'left' | 'center' | 'right';
  /** Legend layout */
  layout: 'horizontal' | 'vertical';
  /** Legend style */
  style: LegendStyle;
  /** Legend items */
  items?: LegendItem[];
}

/**
 * Legend Style
 */
export interface LegendStyle {
  /** Background color */
  backgroundColor?: string;
  /** Border color */
  borderColor?: string;
  /** Border width */
  borderWidth?: number;
  /** Border radius */
  borderRadius?: number;
  /** Padding */
  padding: number;
  /** Item spacing */
  itemSpacing: number;
  /** Text style */
  textStyle: TextStyle;
}

/**
 * Legend Item
 */
export interface LegendItem {
  /** Item name */
  name: string;
  /** Item color */
  color: string;
  /** Item symbol */
  symbol: 'circle' | 'square' | 'diamond' | 'triangle';
  /** Item visible */
  visible: boolean;
}

/**
 * Chart Axes Configuration
 */
export interface ChartAxes {
  /** X-axis configuration */
  xAxis: AxisConfig;
  /** Y-axis configuration */
  yAxis: AxisConfig;
  /** Secondary Y-axis */
  y2Axis?: AxisConfig;
}

/**
 * Axis Configuration
 */
export interface AxisConfig {
  /** Axis title */
  title?: string;
  /** Axis type */
  type: 'category' | 'numeric' | 'datetime' | 'logarithmic';
  /** Axis minimum value */
  min?: number | Date;
  /** Axis maximum value */
  max?: number | Date;
  /** Axis tick interval */
  tickInterval?: number;
  /** Axis labels */
  labels: AxisLabels;
  /** Axis grid lines */
  gridLines: AxisGridLines;
  /** Axis line style */
  line: LineStyle;
}

/**
 * Axis Labels Configuration
 */
export interface AxisLabels {
  /** Labels enabled */
  enabled: boolean;
  /** Label format */
  format?: string;
  /** Label rotation */
  rotation: number;
  /** Label style */
  style: TextStyle;
  /** Label step */
  step?: number;
  /** Label overflow handling */
  overflow: 'allow' | 'justify' | 'wrap';
}

/**
 * Axis Grid Lines Configuration
 */
export interface AxisGridLines {
  /** Grid lines enabled */
  enabled: boolean;
  /** Grid line color */
  color: string;
  /** Grid line width */
  width: number;
  /** Grid line style */
  style: 'solid' | 'dashed' | 'dotted';
  /** Grid line opacity */
  opacity: number;
}

/**
 * Line Style
 */
export interface LineStyle {
  /** Line color */
  color: string;
  /** Line width */
  width: number;
  /** Line style */
  style: 'solid' | 'dashed' | 'dotted';
  /** Line opacity */
  opacity: number;
}

/**
 * Chart Grid Configuration
 */
export interface ChartGrid {
  /** Grid enabled */
  enabled: boolean;
  /** Grid color */
  color: string;
  /** Grid width */
  width: number;
  /** Grid style */
  style: 'solid' | 'dashed' | 'dotted';
  /** Grid opacity */
  opacity: number;
}

/**
 * Chart Tooltip Configuration
 */
export interface ChartTooltip {
  /** Tooltip enabled */
  enabled: boolean;
  /** Tooltip format */
  format?: string;
  /** Tooltip style */
  style: TooltipStyle;
  /** Tooltip behavior */
  behavior: TooltipBehavior;
}

/**
 * Tooltip Style
 */
export interface TooltipStyle {
  /** Background color */
  backgroundColor: string;
  /** Border color */
  borderColor: string;
  /** Border width */
  borderWidth: number;
  /** Border radius */
  borderRadius: number;
  /** Text color */
  textColor: string;
  /** Font size */
  fontSize: number;
  /** Padding */
  padding: number;
  /** Shadow */
  shadow?: ShadowStyle;
}

/**
 * Shadow Style
 */
export interface ShadowStyle {
  /** Shadow color */
  color: string;
  /** Shadow offset X */
  offsetX: number;
  /** Shadow offset Y */
  offsetY: number;
  /** Shadow blur */
  blur: number;
}

/**
 * Tooltip Behavior
 */
export interface TooltipBehavior {
  /** Trigger event */
  trigger: 'hover' | 'click' | 'none';
  /** Follow pointer */
  followPointer: boolean;
  /** Hide delay (ms) */
  hideDelay: number;
  /** Show delay (ms) */
  showDelay: number;
}

/**
 * Responsive Settings
 */
export interface ResponsiveSettings {
  /** Responsive enabled */
  enabled: boolean;
  /** Maintain aspect ratio */
  maintainAspectRatio: boolean;
  /** Responsive rules */
  rules: ResponsiveRule[];
}

/**
 * Responsive Rule
 */
export interface ResponsiveRule {
  /** Condition */
  condition: ResponsiveCondition;
  /** Chart options override */
  chartOptions: Partial<ChartOptions>;
}

/**
 * Responsive Condition
 */
export interface ResponsiveCondition {
  /** Maximum width */
  maxWidth?: number;
  /** Minimum width */
  minWidth?: number;
  /** Maximum height */
  maxHeight?: number;
  /** Minimum height */
  minHeight?: number;
}

/**
 * Chart Animations
 */
export interface ChartAnimations {
  /** Animation enabled */
  enabled: boolean;
  /** Animation duration (ms) */
  duration: number;
  /** Animation easing */
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  /** Animation delay (ms) */
  delay: number;
  /** Animation loop */
  loop: boolean;
}

/**
 * Chart Data Configuration
 */
export interface ChartDataConfig {
  /** Data series */
  series: DataSeries[];
  /** Data categories */
  categories?: string[];
  /** Data colors */
  colors?: string[];
  /** Data sorting */
  sorting?: DataSorting;
}

/**
 * Data Series
 */
export interface DataSeries {
  /** Series name */
  name: string;
  /** Series data */
  data: DataPoint[];
  /** Series type (for combination charts) */
  type?: ChartType;
  /** Series color */
  color?: string;
  /** Series visible */
  visible: boolean;
  /** Series axis (for dual-axis charts) */
  yAxis?: number;
  /** Series marker */
  marker?: SeriesMarker;
}

/**
 * Data Point
 */
export interface DataPoint {
  /** X value */
  x?: any;
  /** Y value */
  y: number;
  /** Data label */
  label?: string;
  /** Data color */
  color?: string;
  /** Data metadata */
  metadata?: Record<string, any>;
}

/**
 * Series Marker
 */
export interface SeriesMarker {
  /** Marker enabled */
  enabled: boolean;
  /** Marker symbol */
  symbol: 'circle' | 'square' | 'diamond' | 'triangle';
  /** Marker radius */
  radius: number;
  /** Marker fill color */
  fillColor?: string;
  /** Marker line color */
  lineColor?: string;
  /** Marker line width */
  lineWidth: number;
}

/**
 * Data Sorting
 */
export interface DataSorting {
  /** Sort field */
  field: string;
  /** Sort order */
  order: 'asc' | 'desc';
  /** Sort enabled */
  enabled: boolean;
}

/**
 * Chart Style
 */
export interface ChartStyle {
  /** Color scheme */
  colorScheme: ColorScheme;
  /** Typography */
  typography: TypographySettings;
  /** Spacing */
  spacing: SpacingSettings;
  /** Border */
  border?: BorderStyle;
  /** Background */
  background?: BackgroundStyle;
}

/**
 * Color Scheme
 */
export interface ColorScheme {
  /** Scheme name */
  name: string;
  /** Primary colors */
  primary: string[];
  /** Secondary colors */
  secondary?: string[];
  /** Accent colors */
  accent?: string[];
  /** Neutral colors */
  neutral?: string[];
}

/**
 * Typography Settings
 */
export interface TypographySettings {
  /** Font family */
  fontFamily: string;
  /** Font sizes */
  fontSizes: FontSizeConfig;
  /** Font weights */
  fontWeights: FontWeightConfig;
  /** Line height */
  lineHeight: number;
}

/**
 * Font Weight Configuration
 */
export interface FontWeightConfig {
  /** Light font weight */
  light: number;
  /** Normal font weight */
  normal: number;
  /** Medium font weight */
  medium: number;
  /** Bold font weight */
  bold: number;
}

/**
 * Spacing Settings
 */
export interface SpacingSettings {
  /** Base spacing unit */
  base: number;
  /** Padding */
  padding: SpacingValues;
  /** Margin */
  margin: SpacingValues;
}

/**
 * Spacing Values
 */
export interface SpacingValues {
  /** Small spacing */
  small: number;
  /** Medium spacing */
  medium: number;
  /** Large spacing */
  large: number;
  /** Extra large spacing */
  xlarge: number;
}

/**
 * Border Style
 */
export interface BorderStyle {
  /** Border color */
  color: string;
  /** Border width */
  width: number;
  /** Border style */
  style: 'solid' | 'dashed' | 'dotted';
  /** Border radius */
  radius: number;
}

/**
 * Background Style
 */
export interface BackgroundStyle {
  /** Background color */
  color?: string;
  /** Background gradient */
  gradient?: GradientStyle;
  /** Background image */
  image?: BackgroundImage;
}

/**
 * Gradient Style
 */
export interface GradientStyle {
  /** Gradient type */
  type: 'linear' | 'radial';
  /** Gradient direction (for linear) */
  direction?: number;
  /** Gradient stops */
  stops: GradientStop[];
}

/**
 * Gradient Stop
 */
export interface GradientStop {
  /** Stop position (0-1) */
  position: number;
  /** Stop color */
  color: string;
  /** Stop opacity */
  opacity?: number;
}

/**
 * Background Image
 */
export interface BackgroundImage {
  /** Image URL */
  url: string;
  /** Image repeat */
  repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  /** Image position */
  position: string;
  /** Image size */
  size: 'auto' | 'cover' | 'contain' | string;
  /** Image opacity */
  opacity: number;
}

/**
 * Chart Interactions
 */
export interface ChartInteractions {
  /** Hover interactions */
  hover: HoverInteraction;
  /** Click interactions */
  click: ClickInteraction;
  /** Zoom interactions */
  zoom?: ZoomInteraction;
  /** Pan interactions */
  pan?: PanInteraction;
  /** Selection interactions */
  selection?: SelectionInteraction;
}

/**
 * Hover Interaction
 */
export interface HoverInteraction {
  /** Hover enabled */
  enabled: boolean;
  /** Hover effect */
  effect: 'highlight' | 'dim' | 'none';
  /** Hover intensity */
  intensity: number;
}

/**
 * Click Interaction
 */
export interface ClickInteraction {
  /** Click enabled */
  enabled: boolean;
  /** Click action */
  action: 'select' | 'drill_down' | 'navigate' | 'custom';
  /** Click handler */
  handler?: string;
}

/**
 * Zoom Interaction
 */
export interface ZoomInteraction {
  /** Zoom enabled */
  enabled: boolean;
  /** Zoom type */
  type: 'x' | 'y' | 'xy';
  /** Zoom sensitivity */
  sensitivity: number;
  /** Zoom limits */
  limits: ZoomLimits;
}

/**
 * Zoom Limits
 */
export interface ZoomLimits {
  /** Minimum zoom */
  min: number;
  /** Maximum zoom */
  max: number;
}

/**
 * Pan Interaction
 */
export interface PanInteraction {
  /** Pan enabled */
  enabled: boolean;
  /** Pan type */
  type: 'x' | 'y' | 'xy';
  /** Pan threshold */
  threshold: number;
}

/**
 * Selection Interaction
 */
export interface SelectionInteraction {
  /** Selection enabled */
  enabled: boolean;
  /** Selection mode */
  mode: 'single' | 'multiple' | 'range';
  /** Selection style */
  style: SelectionStyle;
}

/**
 * Selection Style
 */
export interface SelectionStyle {
  /** Selection color */
  color: string;
  /** Selection opacity */
  opacity: number;
  /** Selection border */
  border: BorderStyle;
}

/**
 * Chart Annotation
 */
export interface ChartAnnotation {
  /** Annotation ID */
  id: string;
  /** Annotation type */
  type: AnnotationType;
  /** Annotation position */
  position: AnnotationPosition;
  /** Annotation content */
  content: AnnotationContent;
  /** Annotation style */
  style: AnnotationStyle;
}

/**
 * Annotation Types
 */
export type AnnotationType =
  | 'line' // Line annotation
  | 'area' // Area annotation
  | 'point' // Point annotation
  | 'text' // Text annotation
  | 'image' // Image annotation
  | 'shape'; // Shape annotation

/**
 * Annotation Position
 */
export interface AnnotationPosition {
  /** X position */
  x: number | Date | string;
  /** Y position */
  y?: number;
  /** Width (for area annotations) */
  width?: number;
  /** Height (for area annotations) */
  height?: number;
}

/**
 * Annotation Content
 */
export interface AnnotationContent {
  /** Text content */
  text?: string;
  /** Image URL */
  imageUrl?: string;
  /** HTML content */
  html?: string;
}

/**
 * Annotation Style
 */
export interface AnnotationStyle {
  /** Color */
  color: string;
  /** Background color */
  backgroundColor?: string;
  /** Border style */
  border?: BorderStyle;
  /** Text style */
  textStyle?: TextStyle;
  /** Opacity */
  opacity: number;
}

// ================================
// Chart Data Types
// ================================

/**
 * Chart Data
 */
export interface ChartData {
  /** Data series */
  series: ChartDataSeries[];
  /** Data categories */
  categories: string[];
  /** Data metadata */
  metadata: ChartDataMetadata;
}

/**
 * Chart Data Series
 */
export interface ChartDataSeries {
  /** Series ID */
  id: string;
  /** Series name */
  name: string;
  /** Series data points */
  data: ChartDataPoint[];
  /** Series type */
  type: ChartType;
  /** Series configuration */
  config: SeriesConfig;
}

/**
 * Chart Data Point
 */
export interface ChartDataPoint {
  /** X value */
  x: any;
  /** Y value */
  y: number;
  /** Additional values for complex charts */
  z?: number;
  /** Data point label */
  label?: string;
  /** Data point color */
  color?: string;
  /** Data point metadata */
  metadata?: DataPointMetadata;
}

/**
 * Data Point Metadata
 */
export interface DataPointMetadata {
  /** Original data record */
  originalData: any;
  /** Calculated values */
  calculated: Record<string, number>;
  /** Contextual information */
  context: Record<string, any>;
  /** Quality indicators */
  quality: DataPointQuality;
}

/**
 * Data Point Quality
 */
export interface DataPointQuality {
  /** Data confidence (0-1) */
  confidence: number;
  /** Data accuracy flag */
  accurate: boolean;
  /** Data completeness flag */
  complete: boolean;
  /** Data source reliability */
  reliability: number;
}

/**
 * Series Configuration
 */
export interface SeriesConfig {
  /** Series visibility */
  visible: boolean;
  /** Series color */
  color: string;
  /** Series opacity */
  opacity: number;
  /** Series line style */
  lineStyle?: LineStyle;
  /** Series marker style */
  markerStyle?: SeriesMarker;
  /** Series fill style */
  fillStyle?: FillStyle;
}

/**
 * Fill Style
 */
export interface FillStyle {
  /** Fill enabled */
  enabled: boolean;
  /** Fill color */
  color: string;
  /** Fill opacity */
  opacity: number;
  /** Fill pattern */
  pattern?: 'solid' | 'striped' | 'dotted' | 'crosshatch';
}

/**
 * Chart Data Metadata
 */
export interface ChartDataMetadata {
  /** Total data points */
  totalDataPoints: number;
  /** Data date range */
  dateRange: AnalyticsDateRange;
  /** Data quality score */
  qualityScore: number;
  /** Data completeness */
  completeness: number;
  /** Data sources */
  sources: string[];
  /** Last updated */
  lastUpdated: Date;
}

// ================================
// Summary Statistics
// ================================

/**
 * Summary Statistics
 */
export interface SummaryStatistics {
  /** Count statistics */
  count: CountStatistics;
  /** Central tendency */
  centralTendency: CentralTendencyStatistics;
  /** Dispersion statistics */
  dispersion: DispersionStatistics;
  /** Distribution statistics */
  distribution: DistributionStatistics;
  /** Correlation statistics */
  correlations: CorrelationStatistics;
}

/**
 * Count Statistics
 */
export interface CountStatistics {
  /** Total count */
  total: number;
  /** Valid count */
  valid: number;
  /** Missing count */
  missing: number;
  /** Unique count */
  unique: number;
  /** Duplicate count */
  duplicates: number;
}

/**
 * Central Tendency Statistics
 */
export interface CentralTendencyStatistics {
  /** Mean */
  mean: number;
  /** Median */
  median: number;
  /** Mode */
  mode: number[];
  /** Geometric mean */
  geometricMean?: number;
  /** Harmonic mean */
  harmonicMean?: number;
}

/**
 * Dispersion Statistics
 */
export interface DispersionStatistics {
  /** Range */
  range: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Variance */
  variance: number;
  /** Standard deviation */
  standardDeviation: number;
  /** Coefficient of variation */
  coefficientOfVariation: number;
  /** Interquartile range */
  interquartileRange: number;
}

/**
 * Distribution Statistics
 */
export interface DistributionStatistics {
  /** Quartiles */
  quartiles: QuartileStatistics;
  /** Percentiles */
  percentiles: PercentileStatistics;
  /** Skewness */
  skewness: number;
  /** Kurtosis */
  kurtosis: number;
  /** Distribution type */
  distributionType: string;
  /** Normality test */
  normalityTest: NormalityTestResult;
}

/**
 * Quartile Statistics
 */
export interface QuartileStatistics {
  /** Q1 (25th percentile) */
  q1: number;
  /** Q2 (50th percentile / median) */
  q2: number;
  /** Q3 (75th percentile) */
  q3: number;
}

/**
 * Percentile Statistics
 */
export interface PercentileStatistics {
  /** 5th percentile */
  p5: number;
  /** 10th percentile */
  p10: number;
  /** 25th percentile */
  p25: number;
  /** 50th percentile */
  p50: number;
  /** 75th percentile */
  p75: number;
  /** 90th percentile */
  p90: number;
  /** 95th percentile */
  p95: number;
  /** 99th percentile */
  p99: number;
}

/**
 * Normality Test Result
 */
export interface NormalityTestResult {
  /** Test statistic */
  statistic: number;
  /** P-value */
  pValue: number;
  /** Is normal distribution */
  isNormal: boolean;
  /** Test method */
  method: string;
  /** Confidence level */
  confidenceLevel: number;
}

/**
 * Correlation Statistics
 */
export interface CorrelationStatistics {
  /** Correlation matrix */
  matrix: CorrelationMatrix;
  /** Significant correlations */
  significant: SignificantCorrelation[];
}

/**
 * Correlation Matrix
 */
export interface CorrelationMatrix {
  /** Variables */
  variables: string[];
  /** Correlation values */
  values: number[][];
  /** P-values */
  pValues: number[][];
}

/**
 * Significant Correlation
 */
export interface SignificantCorrelation {
  /** Variable 1 */
  variable1: string;
  /** Variable 2 */
  variable2: string;
  /** Correlation coefficient */
  correlation: number;
  /** P-value */
  pValue: number;
  /** Significance level */
  significance: 'low' | 'medium' | 'high';
}

// ================================
// Trend Analysis
// ================================

/**
 * Trend Analysis
 */
export interface TrendAnalysis {
  /** Overall trend */
  overall: OverallTrend;
  /** Trend components */
  components: TrendComponents;
  /** Trend forecasting */
  forecast: TrendForecast;
  /** Trend detection */
  detection: TrendDetection;
  /** Seasonality analysis */
  seasonality: SeasonalityAnalysis;
}

/**
 * Overall Trend
 */
export interface OverallTrend {
  /** Trend direction */
  direction: TrendDirection;
  /** Trend strength */
  strength: number;
  /** Trend confidence */
  confidence: number;
  /** Trend description */
  description: string;
  /** Trend significance */
  significance: number;
}

/**
 * Trend Components
 */
export interface TrendComponents {
  /** Trend component */
  trend: TrendComponent;
  /** Seasonal component */
  seasonal: SeasonalComponent;
  /** Cyclical component */
  cyclical: CyclicalComponent;
  /** Irregular component */
  irregular: IrregularComponent;
}

/**
 * Trend Component
 */
export interface TrendComponent {
  /** Component values */
  values: number[];
  /** Component slope */
  slope: number;
  /** Component strength */
  strength: number;
  /** Component description */
  description: string;
}

/**
 * Seasonal Component
 */
export interface SeasonalComponent {
  /** Component values */
  values: number[];
  /** Seasonal period */
  period: number;
  /** Seasonal strength */
  strength: number;
  /** Seasonal patterns */
  patterns: SeasonalPattern[];
}

/**
 * Seasonal Pattern
 */
export interface SeasonalPattern {
  /** Pattern name */
  name: string;
  /** Pattern period */
  period: number;
  /** Pattern amplitude */
  amplitude: number;
  /** Pattern phase */
  phase: number;
  /** Pattern strength */
  strength: number;
}

/**
 * Cyclical Component
 */
export interface CyclicalComponent {
  /** Component values */
  values: number[];
  /** Cycle length */
  cycleLength: number;
  /** Cycle amplitude */
  amplitude: number;
  /** Cycle strength */
  strength: number;
}

/**
 * Irregular Component
 */
export interface IrregularComponent {
  /** Component values */
  values: number[];
  /** Volatility measure */
  volatility: number;
  /** Outlier count */
  outliers: number;
  /** Noise level */
  noiseLevel: number;
}

/**
 * Trend Forecast
 */
export interface TrendForecast {
  /** Forecast method */
  method: ForecastMethod;
  /** Forecast values */
  values: ForecastValue[];
  /** Forecast accuracy */
  accuracy: ForecastAccuracy;
  /** Forecast assumptions */
  assumptions: string[];
}

/**
 * Forecast Method
 */
export type ForecastMethod =
  | 'linear_regression'
  | 'polynomial_regression'
  | 'exponential_smoothing'
  | 'arima'
  | 'seasonal_decomposition'
  | 'neural_network'
  | 'ensemble';

/**
 * Forecast Value
 */
export interface ForecastValue {
  /** Forecast date */
  date: Date;
  /** Forecast value */
  value: number;
  /** Confidence interval */
  confidenceInterval: ConfidenceInterval;
  /** Forecast probability */
  probability: number;
}

/**
 * Confidence Interval
 */
export interface ConfidenceInterval {
  /** Lower bound */
  lower: number;
  /** Upper bound */
  upper: number;
  /** Confidence level */
  level: number;
}

/**
 * Forecast Accuracy
 */
export interface ForecastAccuracy {
  /** Mean absolute error */
  mae: number;
  /** Mean squared error */
  mse: number;
  /** Root mean squared error */
  rmse: number;
  /** Mean absolute percentage error */
  mape: number;
  /** Accuracy score */
  score: number;
}

/**
 * Trend Detection
 */
export interface TrendDetection {
  /** Detected trends */
  trends: DetectedTrend[];
  /** Change points */
  changePoints: ChangePoint[];
  /** Anomalies */
  anomalies: Anomaly[];
}

/**
 * Detected Trend
 */
export interface DetectedTrend {
  /** Trend start date */
  startDate: Date;
  /** Trend end date */
  endDate: Date;
  /** Trend direction */
  direction: TrendDirection;
  /** Trend strength */
  strength: number;
  /** Trend significance */
  significance: number;
  /** Trend description */
  description: string;
}

/**
 * Change Point
 */
export interface ChangePoint {
  /** Change point date */
  date: Date;
  /** Change magnitude */
  magnitude: number;
  /** Change direction */
  direction: 'increase' | 'decrease';
  /** Change probability */
  probability: number;
  /** Change description */
  description: string;
}

/**
 * Anomaly
 */
export interface Anomaly {
  /** Anomaly date */
  date: Date;
  /** Anomaly value */
  value: number;
  /** Expected value */
  expected: number;
  /** Anomaly score */
  score: number;
  /** Anomaly type */
  type: 'outlier' | 'drift' | 'spike' | 'dip';
  /** Anomaly description */
  description: string;
}

/**
 * Seasonality Analysis
 */
export interface SeasonalityAnalysis {
  /** Seasonality detected */
  detected: boolean;
  /** Seasonal periods */
  periods: SeasonalPeriod[];
  /** Seasonal strength */
  strength: number;
  /** Seasonal decomposition */
  decomposition: SeasonalDecomposition;
}

/**
 * Seasonal Period
 */
export interface SeasonalPeriod {
  /** Period name */
  name: string;
  /** Period length */
  length: number;
  /** Period strength */
  strength: number;
  /** Period pattern */
  pattern: number[];
}

/**
 * Seasonal Decomposition
 */
export interface SeasonalDecomposition {
  /** Original data */
  original: number[];
  /** Trend component */
  trend: number[];
  /** Seasonal component */
  seasonal: number[];
  /** Residual component */
  residual: number[];
  /** Decomposition method */
  method: 'additive' | 'multiplicative';
}

// ================================
// Data Insights
// ================================

/**
 * Data Insight
 */
export interface DataInsight {
  /** Insight ID */
  id: string;
  /** Insight type */
  type: InsightType;
  /** Insight title */
  title: string;
  /** Insight description */
  description: string;
  /** Insight significance */
  significance: InsightSignificance;
  /** Insight confidence */
  confidence: number;
  /** Supporting evidence */
  evidence: InsightEvidence;
  /** Recommended actions */
  actions: InsightAction[];
  /** Insight metadata */
  metadata: InsightMetadata;
}

/**
 * Insight Types
 */
export type InsightType =
  | 'trend' // Trend-related insight
  | 'anomaly' // Anomaly detection
  | 'correlation' // Correlation discovery
  | 'pattern' // Pattern recognition
  | 'threshold' // Threshold breach
  | 'forecast' // Predictive insight
  | 'comparison' // Comparative analysis
  | 'opportunity' // Improvement opportunity
  | 'risk' // Risk identification
  | 'achievement'; // Achievement recognition

/**
 * Insight Significance
 */
export type InsightSignificance = 'low' | 'medium' | 'high' | 'critical';

/**
 * Insight Evidence
 */
export interface InsightEvidence {
  /** Evidence type */
  type: 'statistical' | 'visual' | 'comparative' | 'historical';
  /** Evidence data */
  data: any;
  /** Evidence strength */
  strength: number;
  /** Evidence description */
  description: string;
}

/**
 * Insight Action
 */
export interface InsightAction {
  /** Action type */
  type: 'investigate' | 'optimize' | 'alert' | 'automate' | 'plan';
  /** Action description */
  description: string;
  /** Action priority */
  priority: 'low' | 'medium' | 'high' | 'urgent';
  /** Action effort */
  effort: 'low' | 'medium' | 'high';
  /** Action impact */
  impact: 'low' | 'medium' | 'high';
}

/**
 * Insight Metadata
 */
export interface InsightMetadata {
  /** Creation timestamp */
  createdAt: Date;
  /** Creator (system/user) */
  createdBy: string;
  /** Insight version */
  version: number;
  /** Related insights */
  relatedInsights: string[];
  /** Tags */
  tags: string[];
}

// ================================
// Analytics Filters
// ================================

/**
 * Analytics Filter
 */
export interface AnalyticsFilter {
  /** Filter ID */
  id: string;
  /** Filter name */
  name: string;
  /** Filter type */
  type: AnalyticsFilterType;
  /** Filter operator */
  operator: FilterOperator;
  /** Filter value */
  value: any;
  /** Filter enabled */
  enabled: boolean;
  /** Filter metadata */
  metadata: FilterMetadata;
}

/**
 * Analytics Filter Types
 */
export type AnalyticsFilterType =
  | 'date_range'
  | 'metric'
  | 'dimension'
  | 'user_segment'
  | 'goal_category'
  | 'achievement_type'
  | 'exercise_type'
  | 'fitness_level'
  | 'custom';

/**
 * Filter Metadata
 */
export interface FilterMetadata {
  /** Filter description */
  description?: string;
  /** Filter category */
  category: string;
  /** Filter usage count */
  usageCount: number;
  /** Filter last used */
  lastUsed: Date;
  /** Filter created by */
  createdBy: string;
}

// Export all progress analytics types
export type {
  ProgressAnalyticsDashboard,
  AnalyticsWidget,
  ChartConfiguration,
  ProgressAnalyticsData,
  AnalyticsDashboardState,
};
