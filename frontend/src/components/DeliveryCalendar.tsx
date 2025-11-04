import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { deliveriesAPI, areasAPI } from '../services/api';
import toast from 'react-hot-toast';

interface CalendarDay {
  date: string;
  scheduled_date: string;
  total_deliveries: number;
  completed: number;
  scheduled: number;
  missed: number;
  cancelled: number;
  out_for_delivery: number;
  total_quantity: number;
  total_amount: number;
}

interface Area {
  id: string;
  name: string;
  code: string;
}

interface DeliveryCalendarProps {
  onDateSelect: (date: string) => void;
  selectedDate?: string;
}

const DeliveryCalendar: React.FC<DeliveryCalendarProps> = ({ onDateSelect, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, selectedArea]);

  const loadAreas = async () => {
    try {
      const response = await areasAPI.getAll();
      setAreas(response.data.data);
    } catch (error) {
      toast.error('Failed to load areas');
    }
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const response = await deliveriesAPI.getCalendar(
        year,
        month + 1,
        selectedArea || undefined
      );
      setCalendarData(response.data.data);
    } catch (error) {
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDataForDate = (day: number): CalendarDay | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarData.find((d) => d.scheduled_date === dateStr);
  };

  const getDayStatus = (dayData: CalendarDay | undefined, day: number): string => {
    if (!dayData || dayData.total_deliveries === 0) {
      return 'bg-white hover:bg-gray-50';
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const isPast = dateStr < today;

    // All completed
    if (dayData.completed === dayData.total_deliveries) {
      return 'bg-green-50 hover:bg-green-100 border-green-200';
    }

    // Has missed deliveries
    if (dayData.missed > 0) {
      return 'bg-red-50 hover:bg-red-100 border-red-200';
    }

    // In progress (some completed, some pending)
    if (dayData.out_for_delivery > 0 || (dayData.completed > 0 && dayData.completed < dayData.total_deliveries)) {
      return 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200';
    }

    // Scheduled/pending
    if (isPast && dayData.scheduled > 0) {
      return 'bg-orange-50 hover:bg-orange-100 border-orange-200'; // Past but not completed
    }

    return 'bg-blue-50 hover:bg-blue-100 border-blue-200'; // Future scheduled
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === selectedDate;
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateSelect(dateStr);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Create array of day cells
  const dayCells = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    dayCells.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = getDataForDate(day);
    const statusClass = getDayStatus(dayData, day);
    const isTodayDate = isToday(day);
    const isSelectedDate = isSelected(day);

    dayCells.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`
          aspect-square p-1 sm:p-2 rounded-lg border-2 transition-all
          ${statusClass}
          ${isTodayDate ? 'ring-2 ring-fresh-green ring-offset-2' : 'border-gray-200'}
          ${isSelectedDate ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          ${dayData && dayData.total_deliveries > 0 ? 'cursor-pointer' : 'cursor-default'}
        `}
      >
        <div className="text-right">
          <span className={`text-xs sm:text-sm font-semibold ${isTodayDate ? 'text-fresh-green' : 'text-gray-700'}`}>
            {day}
          </span>
        </div>
        {dayData && dayData.total_deliveries > 0 && (
          <div className="mt-1 space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <Package className="w-3 h-3 text-gray-600" />
              <span className="text-xs font-bold text-gray-900">{dayData.total_deliveries}</span>
            </div>
            <div className="text-[10px] leading-tight space-y-0.5">
              {dayData.completed > 0 && (
                <div className="text-green-700">✓ {dayData.completed}</div>
              )}
              {dayData.out_for_delivery > 0 && (
                <div className="text-blue-700">⏱ {dayData.out_for_delivery}</div>
              )}
              {dayData.scheduled > 0 && (
                <div className="text-gray-600">□ {dayData.scheduled}</div>
              )}
              {dayData.missed > 0 && (
                <div className="text-red-700">✕ {dayData.missed}</div>
              )}
            </div>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 min-w-[200px] text-center">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Area Filter */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">All Areas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
          <span>Missed</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-fresh-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {dayCells}
          </div>
        </>
      )}
    </div>
  );
};

export default DeliveryCalendar;
