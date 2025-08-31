/**
 * Log Measurement Dialog Component
 * Modal form for logging new body measurements with validation and smart defaults
 */
'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type ControllerRenderProps } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Scale,
  Camera,
  Smartphone,
  Activity,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Form validation schema
const measurementFormSchema = z.object({
  measurementType: z.enum(
    ['weight', 'body_fat', 'muscle_mass', 'circumference'],
    {
      required_error: 'Please select a measurement type',
    }
  ),
  measurementLocation: z.string().optional(),
  value: z
    .number({
      required_error: 'Value is required',
      invalid_type_error: 'Please enter a valid number',
    })
    .positive('Value must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  measuredAt: z.date({
    required_error: 'Please select a date and time',
  }),
  measurementMethod: z.string().optional(),
  measurementDevice: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
});

type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

interface LogMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MeasurementFormValues) => Promise<void>;
  defaultType?: 'weight' | 'body_fat' | 'muscle_mass' | 'circumference';
  isLoading?: boolean;
}

// Measurement type configurations
const measurementConfigs = {
  weight: {
    icon: Scale,
    color: 'bg-primary-50 text-primary-700 border-primary-200',
    selectedColor: 'bg-primary-100 border-primary-300',
    iconColor: 'text-primary-600',
    defaultUnit: 'lbs',
    units: ['lbs', 'kg'],
    placeholder: '175.5',
    step: '0.1',
    locations: null,
  },
  body_fat: {
    icon: Activity,
    color: 'bg-warning-50 text-warning-700 border-warning-200',
    selectedColor: 'bg-warning-100 border-warning-300',
    iconColor: 'text-warning-600',
    defaultUnit: '%',
    units: ['%'],
    placeholder: '18.5',
    step: '0.1',
    locations: null,
  },
  muscle_mass: {
    icon: User,
    color: 'bg-success-50 text-success-700 border-success-200',
    selectedColor: 'bg-success-100 border-success-300',
    iconColor: 'text-success-600',
    defaultUnit: 'lbs',
    units: ['lbs', 'kg'],
    placeholder: '140.2',
    step: '0.1',
    locations: null,
  },
  circumference: {
    icon: Activity,
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    selectedColor: 'bg-gray-100 border-gray-300',
    iconColor: 'text-gray-600',
    defaultUnit: 'in',
    units: ['in', 'cm'],
    placeholder: '32.5',
    step: '0.1',
    locations: ['waist', 'chest', 'arm', 'thigh', 'neck', 'hip'],
  },
};

const measurementMethods = [
  'digital_scale',
  'analog_scale',
  'body_fat_scale',
  'calipers',
  'dexa_scan',
  'bod_pod',
  'tape_measure',
  'manual_entry',
];

const commonDevices = [
  'Fitbit Aria',
  'Withings Body+',
  'Garmin Index',
  'RENPHO Smart Scale',
  'Tanita Scale',
  'FitIndex Smart Scale',
  'Manual Measurement',
  'Other',
];

export function LogMeasurementDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultType = 'weight',
  isLoading = false,
}: LogMeasurementDialogProps) {
  const t = useTranslations('progress');
  const [selectedType, setSelectedType] = useState(defaultType);

  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: {
      measurementType: defaultType,
      value: undefined,
      unit: measurementConfigs[defaultType].defaultUnit,
      measuredAt: new Date(),
      measurementMethod: '',
      measurementDevice: '',
      notes: '',
    },
  });

  const config = measurementConfigs[selectedType];
  const Icon = config.icon;

  // Update form when measurement type changes
  useEffect(() => {
    form.setValue('measurementType', selectedType);
    form.setValue('unit', measurementConfigs[selectedType].defaultUnit);
    if (selectedType !== 'circumference') {
      form.setValue('measurementLocation', '');
    }
  }, [selectedType, form]);

  // Handle form submission
  const handleSubmit = async (data: MeasurementFormValues) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting measurement:', error);
    }
  };

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (!isLoading) {
        form.reset();
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-strong'>
        <DialogHeader className='space-y-3'>
          <DialogTitle className='flex items-center gap-3 text-lg font-semibold text-gray-900'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-100'>
              <Icon className='h-5 w-5 text-primary-600' />
            </div>
            {t('logMeasurement.title')}
          </DialogTitle>
          <DialogDescription className='text-sm leading-relaxed text-gray-600'>
            {t('logMeasurement.description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-6'
          >
            {/* Measurement Type Selection */}
            <div className='space-y-4'>
              <Label className='text-sm font-semibold text-gray-900'>
                {t('logMeasurement.measurementType')}
              </Label>
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                {Object.entries(measurementConfigs).map(([type, config]) => {
                  const Icon = config.icon;
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      type='button'
                      onClick={() => setSelectedType(type as any)}
                      className={cn(
                        'flex flex-col items-center gap-3 rounded-xl border p-4 transition-all duration-200',
                        'hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:scale-[0.98]',
                        isSelected
                          ? cn(
                              config.selectedColor,
                              'shadow-sm ring-1 ring-primary-200'
                            )
                          : cn(config.color, 'hover:shadow-sm')
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6',
                          isSelected ? config.iconColor : 'text-gray-500'
                        )}
                      />
                      <span
                        className={cn(
                          'text-center text-xs font-semibold capitalize leading-tight',
                          isSelected ? config.iconColor : 'text-gray-600'
                        )}
                      >
                        {t(`measurements.${type.replace('_', '')}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Measurement Location (for circumference) */}
            {selectedType === 'circumference' && (
              <FormField
                control={form.control}
                name='measurementLocation'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<MeasurementFormValues, any>;
                }) => (
                  <FormItem>
                    <FormLabel className='font-semibold text-gray-900'>
                      {t('logMeasurement.location')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('logMeasurement.selectLocation')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {config.locations?.map((location) => (
                          <SelectItem key={location} value={location}>
                            {t(`measurements.locations.${location}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Value and Unit */}
            <div className='grid grid-cols-3 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='value'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<MeasurementFormValues, any>;
                }) => (
                  <FormItem>
                    <FormLabel className='font-semibold text-gray-900'>
                      {t('logMeasurement.value')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step={config.step}
                        placeholder={config.placeholder}
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            parseFloat(e.target.value) || undefined
                          )
                        }
                        className='text-lg font-semibold text-gray-900 placeholder:text-gray-400'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='unit'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<MeasurementFormValues, any>;
                }) => (
                  <FormItem>
                    <FormLabel className='font-semibold text-gray-900'>
                      {t('logMeasurement.unit')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {config.units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Time */}
            <FormField
              control={form.control}
              name='measuredAt'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='font-semibold text-gray-900'>
                    {t('logMeasurement.measuredAt')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='datetime-local'
                      value={
                        field.value
                          ? format(field.value, "yyyy-MM-dd'T'HH:mm")
                          : ''
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('logMeasurement.dateDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Method and Device */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='measurementMethod'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<MeasurementFormValues, any>;
                }) => (
                  <FormItem>
                    <FormLabel className='font-semibold text-gray-900'>
                      {t('logMeasurement.method')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('logMeasurement.selectMethod')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {measurementMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {t(`methods.${method}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='measurementDevice'
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<MeasurementFormValues, any>;
                }) => (
                  <FormItem>
                    <FormLabel className='font-semibold text-gray-900'>
                      {t('logMeasurement.device')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('logMeasurement.selectDevice')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commonDevices.map((device) => (
                          <SelectItem key={device} value={device}>
                            {device}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='font-semibold text-gray-900'>
                    {t('logMeasurement.notes')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('logMeasurement.notesPlaceholder')}
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('logMeasurement.notesDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Future: Photo Upload */}
            <div className='rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center transition-colors hover:bg-gray-50'>
              <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100'>
                <Camera className='h-6 w-6 text-gray-500' />
              </div>
              <p className='mt-3 text-sm font-medium text-gray-700'>
                {t('logMeasurement.photoUpload')}
              </p>
              <p className='mt-1 text-xs text-gray-500'>
                {t('logMeasurement.photoUploadDescription')}
              </p>
            </div>

            <DialogFooter className='flex flex-col-reverse gap-3 sm:flex-row sm:gap-2'>
              <DialogClose asChild>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isLoading}
                  className='w-full sm:w-auto'
                >
                  {t('common.cancel')}
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={isLoading}
                className='w-full bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500 sm:w-auto'
              >
                {isLoading ? (
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    {t('common.saving')}
                  </div>
                ) : (
                  t('logMeasurement.save')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
