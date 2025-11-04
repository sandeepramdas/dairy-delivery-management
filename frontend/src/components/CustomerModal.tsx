import React, { useEffect, useState, useRef } from 'react';
import { X, User, Phone, Mail, MapPin, Home, Navigation, Search } from 'lucide-react';
import { customersAPI, areasAPI } from '../services/api';
import type { Customer } from '../types';
import toast from 'react-hot-toast';

interface Area {
  id: string;
  name: string;
  code: string;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
  mode: 'create' | 'edit';
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customer,
  mode,
}) => {
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    area_id: '',
    address_line1: '',
    address_line2: '',
    city: '',
    pincode: '',
    latitude: '',
    longitude: '',
    location_notes: '',
    alternate_phone: '',
  });

  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAreas();
      if (mode === 'edit' && customer) {
        setFormData({
          full_name: customer.full_name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          area_id: customer.area_id || '',
          address_line1: customer.address_line1 || '',
          address_line2: customer.address_line2 || '',
          city: customer.city || '',
          pincode: customer.pincode || '',
          latitude: customer.latitude?.toString() || '',
          longitude: customer.longitude?.toString() || '',
          location_notes: customer.location_notes || '',
          alternate_phone: customer.alternate_phone || '',
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, customer]);

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    if (isOpen && addressInputRef.current && window.google) {
      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'in' }, // Restrict to India
          }
        );

        autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isOpen]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.geometry) return;

    const address = place.formatted_address || '';
    const lat = place.geometry.location?.lat() || 0;
    const lng = place.geometry.location?.lng() || 0;

    // Extract address components
    let street = '';
    let city = '';
    let pincode = '';

    place.address_components?.forEach((component) => {
      const types = component.types;
      if (types.includes('street_number') || types.includes('route')) {
        street += component.long_name + ' ';
      }
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('postal_code')) {
        pincode = component.long_name;
      }
    });

    setFormData((prev) => ({
      ...prev,
      address_line1: street.trim() || address,
      city: city || prev.city,
      pincode: pincode || prev.pincode,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));

    toast.success('Location auto-filled from Google Maps');
  };

  const loadAreas = async () => {
    setAreasLoading(true);
    try {
      const response = await areasAPI.getAll({ is_active: true, limit: 100 });
      setAreas(response.data.data || []);
      if (response.data.data && response.data.data.length === 0) {
        toast.error('No areas available. Please create areas first.');
      }
    } catch (error: any) {
      console.error('Failed to load areas:', error);
      toast.error(error.response?.data?.message || 'Failed to load areas. Please try again.');
      setAreas([]);
    } finally {
      setAreasLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      area_id: '',
      address_line1: '',
      address_line2: '',
      city: '',
      pincode: '',
      latitude: '',
      longitude: '',
      location_notes: '',
      alternate_phone: '',
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.full_name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!formData.area_id) {
      toast.error('Please select an area');
      return;
    }
    if (!formData.address_line1.trim()) {
      toast.error('Address is required');
      return;
    }
    if (!formData.city.trim()) {
      toast.error('City is required');
      return;
    }
    if (!formData.pincode.trim()) {
      toast.error('Pincode is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        email: formData.email || null,
        address_line2: formData.address_line2 || null,
        location_notes: formData.location_notes || null,
        alternate_phone: formData.alternate_phone || null,
      };

      if (mode === 'create') {
        await customersAPI.create(payload);
        toast.success('Customer created successfully');
      } else {
        await customersAPI.update(customer!.id, payload);
        toast.success('Customer updated successfully');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to save customer';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-fresh-green to-fresh-lime p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                {mode === 'create' ? 'Add New Customer' : 'Edit Customer'}
              </h2>
              <p className="text-white/80 text-sm">
                {mode === 'create'
                  ? 'Enter customer details below'
                  : 'Update customer information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
            disabled={loading}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-fresh-green" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="input"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dairy-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dairy-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternate Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dairy-400" />
                    <input
                      type="tel"
                      name="alternate_phone"
                      value={formData.alternate_phone}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Alternate contact number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-fresh-green" />
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="area_id"
                    value={formData.area_id}
                    onChange={handleChange}
                    className="input"
                    required
                    disabled={areasLoading}
                  >
                    <option value="">
                      {areasLoading ? 'Loading areas...' : 'Select an area'}
                    </option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name} ({area.code})
                      </option>
                    ))}
                  </select>
                  {!areasLoading && areas.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No areas available. Please create areas from the Areas page first.
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Address (Google Maps) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-4 w-5 h-5 text-dairy-400" />
                    <input
                      ref={addressInputRef}
                      type="text"
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Start typing address to search..."
                      required
                    />
                  </div>
                  <p className="text-xs text-dairy-600 mt-1">
                    Start typing to search for addresses using Google Maps
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    className="input"
                    placeholder="Landmark, Area"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input"
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="input"
                    placeholder="6-digit pincode"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-fresh-green" />
                GPS Coordinates (Auto-filled from Maps)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="input bg-gray-50"
                    placeholder="Auto-filled from search"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="input bg-gray-50"
                    placeholder="Auto-filled from search"
                    readOnly
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Instructions
                  </label>
                  <textarea
                    name="location_notes"
                    value={formData.location_notes}
                    onChange={handleChange}
                    className="input resize-none"
                    rows={3}
                    placeholder="e.g., Ring bell twice, Leave at door, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-dairy-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </span>
              ) : (
                <span>{mode === 'create' ? 'Create Customer' : 'Update Customer'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
