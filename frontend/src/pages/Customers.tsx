import React, { useEffect, useState } from 'react';
import { Search, Plus, Phone, MapPin, User, Eye, Edit } from 'lucide-react';
import { customersAPI } from '../services/api';
import type { Customer } from '../types';
import toast from 'react-hot-toast';
import CustomerModal from '../components/CustomerModal';
import CustomerDetailsModal from '../components/CustomerDetailsModal';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    loadCustomers();
  }, [currentPage, search]);

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll({
        page: currentPage,
        limit: 10,
        search: search || undefined,
        status: 'active',
      });
      setCustomers(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadCustomers();
  };

  const handleEditFromDetails = () => {
    setIsDetailsModalOpen(false);
    if (selectedCustomer) {
      setModalMode('edit');
      setIsModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dairy-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-2">
            Customers 👥
          </h1>
          <p className="text-dairy-600">Manage your customer database</p>
        </div>
        <button
          onClick={handleAddCustomer}
          className="btn-primary flex items-center gap-2 w-full lg:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dairy-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input pl-12"
            placeholder="Search by name, phone, or customer code..."
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {customers.map((customer) => (
          <div key={customer.id} className="card hover:shadow-2xl transform transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-fresh-green to-fresh-lime rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {customer.full_name}
                    </h3>
                    <p className="text-sm text-dairy-600">{customer.customer_code}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      customer.status === 'active'
                        ? 'bg-fresh-mint text-fresh-green'
                        : customer.status === 'inactive'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {customer.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-dairy-600">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dairy-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">
                      {customer.address_line1}, {customer.city} - {customer.pincode}
                    </span>
                  </div>
                  {customer.area_name && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-dairy-100 rounded-lg text-xs font-medium text-dairy-700">
                      {customer.area_name}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-dairy-100">
                  <button
                    onClick={() => handleViewDetails(customer)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-fresh-mint text-fresh-green rounded-lg hover:bg-fresh-green hover:text-white transition-all duration-200 text-sm font-semibold"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-dairy-100 text-dairy-700 rounded-lg hover:bg-dairy-200 transition-all duration-200 text-sm font-semibold"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {customers.length === 0 && (
        <div className="card text-center py-12">
          <User className="w-16 h-16 text-dairy-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No customers found</h3>
          <p className="text-dairy-600 mb-4">
            {search ? 'Try adjusting your search' : 'Get started by adding your first customer'}
          </p>
          <button onClick={handleAddCustomer} className="btn-primary mx-auto">
            <Plus className="w-5 h-5 inline mr-2" />
            Add Customer
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-dairy-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        customer={selectedCustomer}
        mode={modalMode}
      />

      <CustomerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={handleEditFromDetails}
        customerId={selectedCustomer?.id || null}
      />
    </div>
  );
};

export default Customers;
