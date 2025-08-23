/**
 * Template Browser Component
 * Browse, search, and manage workout plan templates with sharing capabilities
 */
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Filter,
  Star,
  StarOff,
  Heart,
  HeartOff,
  Download,
  Share,
  User,
  Users,
  Clock,
  Target,
  Zap,
  Trophy,
  ChevronDown,
  Eye,
  ThumbsUp,
  MessageCircle,
  BookOpen,
  Grid3X3,
  List,
  SlidersHorizontal,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import type { WorkoutPlan, FitnessLevel } from '@/types/workouts';
import { cn } from '@/lib/utils';

interface Template extends WorkoutPlan {
  // Template-specific properties
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified?: boolean;
    followers?: number;
  };
  stats: {
    downloads: number;
    likes: number;
    rating: number;
    reviews: number;
    completions: number;
  };
  tags: string[];
  difficulty: FitnessLevel;
  equipment: string[];
  previewImages?: string[];
  lastUpdated: Date;
}

interface TemplateBrowserProps {
  templates: Template[];
  favorites: Set<string>;
  onTemplateSelect: (template: Template) => void;
  onTemplatePreview: (template: Template) => void;
  onTemplateFavorite: (templateId: string, favorited: boolean) => void;
  onTemplateShare: (template: Template) => void;
  onTemplateDownload: (template: Template) => void;
  onAuthorView: (authorId: string) => void;
  className?: string;
}

type SortOption = 'popular' | 'recent' | 'rating' | 'downloads' | 'name';
type ViewMode = 'grid' | 'list';

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: BookOpen },
  { id: 'strength', label: 'Strength Training', icon: Target },
  { id: 'cardio', label: 'Cardio & HIIT', icon: Zap },
  { id: 'flexibility', label: 'Flexibility & Yoga', icon: User },
  { id: 'sports', label: 'Sport Specific', icon: Trophy },
  { id: 'beginner', label: 'Beginner Friendly', icon: Users },
  { id: 'featured', label: 'Featured', icon: Star },
];

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export function TemplateBrowser({
  templates,
  favorites,
  onTemplateSelect,
  onTemplatePreview,
  onTemplateFavorite,
  onTemplateShare,
  onTemplateDownload,
  onAuthorView,
  className,
}: TemplateBrowserProps) {
  const t = useTranslations('workouts.templates');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    FitnessLevel | 'all'
  >('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          template.author.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          template.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'featured') {
        filtered = filtered.filter((template) => template.isFeatured);
      } else if (selectedCategory === 'beginner') {
        filtered = filtered.filter(
          (template) => template.difficulty === 'beginner'
        );
      } else {
        filtered = filtered.filter(
          (template) =>
            template.fitnessGoals.includes(selectedCategory) ||
            template.tags.includes(selectedCategory)
        );
      }
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(
        (template) => template.difficulty === selectedDifficulty
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.stats.downloads - a.stats.downloads;
        case 'recent':
          return (
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
          );
        case 'rating':
          return b.stats.rating - a.stats.rating;
        case 'downloads':
          return b.stats.downloads - a.stats.downloads;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex flex-col space-y-4'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            {t('browser.title')}
          </h2>
          <p className='text-gray-600'>{t('browser.subtitle')}</p>
        </div>

        {/* Search and Quick Filters */}
        <div className='flex flex-col gap-4 sm:flex-row'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>

          <div className='flex gap-2'>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className='mr-2 h-4 w-4' />
              {t('actions.filters')}
            </Button>

            <div className='flex rounded-lg border'>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('grid')}
                className='rounded-r-none border-r-0'
              >
                <Grid3X3 className='h-4 w-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('list')}
                className='rounded-l-none'
              >
                <List className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className='border-gray-200 bg-gray-50 p-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <Select
                value={selectedDifficulty}
                onValueChange={(value) =>
                  setSelectedDifficulty(value as FitnessLevel | 'all')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.difficulty')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>
                    {t('filters.allDifficulties')}
                  </SelectItem>
                  <SelectItem value='beginner'>
                    {t('difficulty.beginner')}
                  </SelectItem>
                  <SelectItem value='intermediate'>
                    {t('difficulty.intermediate')}
                  </SelectItem>
                  <SelectItem value='advanced'>
                    {t('difficulty.advanced')}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='popular'>{t('sort.popular')}</SelectItem>
                  <SelectItem value='recent'>{t('sort.recent')}</SelectItem>
                  <SelectItem value='rating'>{t('sort.rating')}</SelectItem>
                  <SelectItem value='downloads'>
                    {t('sort.downloads')}
                  </SelectItem>
                  <SelectItem value='name'>{t('sort.name')}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant='outline'
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                  setSortBy('popular');
                }}
              >
                {t('actions.clearFilters')}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div className='flex flex-col gap-6 lg:flex-row'>
        {/* Category Sidebar */}
        <div className='w-full space-y-2 lg:w-64'>
          <h3 className='mb-3 font-semibold text-gray-900'>
            {t('categories.title')}
          </h3>
          <div className='space-y-1'>
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const count =
                category.id === 'all'
                  ? templates.length
                  : templates.filter((t) =>
                      category.id === 'featured'
                        ? t.isFeatured
                        : category.id === 'beginner'
                          ? t.difficulty === 'beginner'
                          : t.fitnessGoals.includes(category.id) ||
                            t.tags.includes(category.id)
                    ).length;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                    selectedCategory === category.id
                      ? 'bg-blue-100 font-medium text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className='h-4 w-4' />
                  <span className='flex-1'>{category.label}</span>
                  <Badge variant='outline' className='text-xs'>
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid/List */}
        <div className='flex-1'>
          {filteredTemplates.length > 0 ? (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'
                  : 'space-y-4'
              )}
            >
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isFavorited={favorites.has(template.id)}
                  viewMode={viewMode}
                  onSelect={() => onTemplateSelect(template)}
                  onPreview={() => onTemplatePreview(template)}
                  onFavorite={(favorited) =>
                    onTemplateFavorite(template.id, favorited)
                  }
                  onShare={() => onTemplateShare(template)}
                  onDownload={() => onTemplateDownload(template)}
                  onAuthorView={() => onAuthorView(template.author.id)}
                />
              ))}
            </div>
          ) : (
            <div className='py-16 text-center'>
              <BookOpen className='mx-auto mb-4 h-16 w-16 text-gray-400' />
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                {t('empty.noTemplates')}
              </h3>
              <p className='mb-6 text-gray-600'>
                {searchQuery ||
                selectedCategory !== 'all' ||
                selectedDifficulty !== 'all'
                  ? t('empty.tryDifferentFilters')
                  : t('empty.noTemplatesAvailable')}
              </p>
              <Button
                variant='outline'
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                }}
              >
                {t('actions.clearFilters')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Template Card Component
function TemplateCard({
  template,
  isFavorited,
  viewMode,
  onSelect,
  onPreview,
  onFavorite,
  onShare,
  onDownload,
  onAuthorView,
}: {
  template: Template;
  isFavorited: boolean;
  viewMode: ViewMode;
  onSelect: () => void;
  onPreview: () => void;
  onFavorite: (favorited: boolean) => void;
  onShare: () => void;
  onDownload: () => void;
  onAuthorView: () => void;
}) {
  const t = useTranslations('workouts.templates');

  if (viewMode === 'list') {
    return (
      <Card className='transition-shadow hover:shadow-md'>
        <CardContent className='p-4'>
          <div className='flex gap-4'>
            {/* Template thumbnail/preview */}
            <div className='flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-200'>
              <Target className='h-8 w-8 text-blue-600' />
            </div>

            <div className='min-w-0 flex-1'>
              <div className='mb-2 flex items-start justify-between'>
                <div>
                  <h3 className='mb-1 truncate font-semibold text-gray-900'>
                    {template.name}
                  </h3>
                  <p className='line-clamp-2 text-sm text-gray-600'>
                    {template.description}
                  </p>
                </div>

                <div className='ml-4 flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => onFavorite(!isFavorited)}
                  >
                    {isFavorited ? (
                      <Heart className='h-4 w-4 fill-current text-red-500' />
                    ) : (
                      <HeartOff className='h-4 w-4 text-gray-400' />
                    )}
                  </Button>

                  <Button variant='ghost' size='sm' onClick={onShare}>
                    <Share className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {/* Author info */}
              <div className='mb-2 flex items-center gap-2'>
                <Avatar className='h-6 w-6'>
                  <AvatarImage src={template.author.avatar} />
                  <AvatarFallback className='text-xs'>
                    {template.author.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={onAuthorView}
                  className='text-sm font-medium text-gray-600 hover:text-blue-600'
                >
                  {template.author.name}
                </button>
                {template.author.verified && (
                  <Badge variant='secondary' className='text-xs'>
                    ✓ Verified
                  </Badge>
                )}
              </div>

              {/* Stats and actions */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4 text-xs text-gray-500'>
                  <div className='flex items-center gap-1'>
                    <Star className='h-3 w-3 fill-current text-yellow-500' />
                    <span>{template.stats.rating.toFixed(1)}</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Download className='h-3 w-3' />
                    <span>{template.stats.downloads.toLocaleString()}</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    <span>{template.estimatedSessionDuration}min</span>
                  </div>
                  <Badge
                    className={cn(
                      'text-xs',
                      DIFFICULTY_COLORS[template.difficulty]
                    )}
                  >
                    {template.difficulty}
                  </Badge>
                </div>

                <div className='flex gap-2'>
                  <Button size='sm' variant='outline' onClick={onPreview}>
                    <Eye className='mr-1 h-4 w-4' />
                    {t('actions.preview')}
                  </Button>
                  <Button size='sm' onClick={onSelect}>
                    <Download className='mr-1 h-4 w-4' />
                    {t('actions.use')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='group transition-all duration-200 hover:shadow-lg'>
      <CardHeader className='pb-3'>
        {/* Template preview/thumbnail */}
        <div className='relative mb-3 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-blue-200'>
          <Target className='h-12 w-12 text-blue-600' />

          {/* Favorite button overlay */}
          <button
            onClick={() => onFavorite(!isFavorited)}
            className='absolute right-2 top-2 rounded-full bg-white/80 p-2 transition-colors hover:bg-white'
          >
            {isFavorited ? (
              <Heart className='h-4 w-4 fill-current text-red-500' />
            ) : (
              <HeartOff className='h-4 w-4 text-gray-400' />
            )}
          </button>
        </div>

        <div className='space-y-2'>
          <div className='flex items-start justify-between'>
            <CardTitle className='line-clamp-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600'>
              {template.name}
            </CardTitle>

            {template.isFeatured && (
              <Badge className='border-yellow-200 bg-yellow-100 text-yellow-800'>
                <Star className='mr-1 h-3 w-3' />
                {t('badges.featured')}
              </Badge>
            )}
          </div>

          <p className='line-clamp-2 text-sm text-gray-600'>
            {template.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        {/* Author */}
        <div className='mb-3 flex items-center gap-2'>
          <Avatar className='h-6 w-6'>
            <AvatarImage src={template.author.avatar} />
            <AvatarFallback className='text-xs'>
              {template.author.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={onAuthorView}
            className='truncate text-sm font-medium text-gray-600 hover:text-blue-600'
          >
            {template.author.name}
          </button>
          {template.author.verified && (
            <Badge variant='secondary' className='text-xs'>
              ✓
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className='mb-3 grid grid-cols-2 gap-3'>
          <div className='flex items-center gap-1 text-sm text-gray-600'>
            <Clock className='h-4 w-4' />
            <span>{template.estimatedSessionDuration}min</span>
          </div>
          <div className='flex items-center gap-1 text-sm text-gray-600'>
            <Target className='h-4 w-4' />
            <span>{template.durationWeeks}w</span>
          </div>
        </div>

        {/* Rating and stats */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-3 text-xs text-gray-500'>
            <div className='flex items-center gap-1'>
              <Star className='h-3 w-3 fill-current text-yellow-500' />
              <span>{template.stats.rating.toFixed(1)}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Download className='h-3 w-3' />
              <span>
                {template.stats.downloads > 999
                  ? `${(template.stats.downloads / 1000).toFixed(1)}k`
                  : template.stats.downloads}
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <ThumbsUp className='h-3 w-3' />
              <span>{template.stats.likes}</span>
            </div>
          </div>

          <Badge
            className={cn('text-xs', DIFFICULTY_COLORS[template.difficulty])}
          >
            {template.difficulty}
          </Badge>
        </div>

        {/* Goals/Tags */}
        <div className='mb-4'>
          <div className='flex flex-wrap gap-1'>
            {template.fitnessGoals.slice(0, 3).map((goal, index) => (
              <Badge key={index} variant='outline' className='text-xs'>
                {goal}
              </Badge>
            ))}
            {template.fitnessGoals.length > 3 && (
              <Badge variant='outline' className='text-xs'>
                +{template.fitnessGoals.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={onPreview}
            className='flex-1'
          >
            <Eye className='mr-1 h-4 w-4' />
            {t('actions.preview')}
          </Button>
          <Button size='sm' onClick={onSelect} className='flex-1'>
            <Download className='mr-1 h-4 w-4' />
            {t('actions.use')}
          </Button>
          <Button size='sm' variant='outline' onClick={onShare}>
            <Share className='h-4 w-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
