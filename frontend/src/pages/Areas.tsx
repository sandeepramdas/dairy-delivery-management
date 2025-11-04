import React, { useEffect, useState } from 'react';
import { Search, Plus, MapPin, Edit, Trash2, AlertCircle, Users } from 'lucide-react';
import { areasAPI } from '../services/api';
import toast from 'react-hot-toast';
import AreaModal from '../components/AreaModal';

interface Area {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  customer_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  areaId: string | null;
  areaName: string;
  customerCount?: number;
}

const Areas: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    areaId: null,
    areaName: '',
    customerCount: 0,
  });
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadAreas();
  }, [currentPage, search, statusFilter]);

  const loadAreas = async () => {
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active';
      }

      const response = await areasAPI.getAll(params);

      // Filter by search on client side since backend doesn't have search parameter
      let filteredAreas = response.data.data;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredAreas = filteredAreas.filter((area: Area) =>
          area.name.toLowerCase().includes(searchLower) ||
          area.code.toLowerCase().includes(searchLower)
        );
      }

      setAreas(filteredAreas);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast.error('Failed to load areas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleAddArea = () => {
    setSelectedArea(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditArea = (area: Area) => {
    setSelectedArea(area);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadAreas();
  };

  const openDeleteDialog = (area: Area) => {
    setConfirmDialog({
      isOpen: true,
      areaId: area.id,
      areaName: area.name,
      customerCount: area.customer_count || 0,
    });
  };

  const handleDeleteArea = async () => {
    if (!confirmDialog.areaId) return;

    setDeleteLoading(confirmDialog.areaId);
    try {
      await areasAPI.delete(confirmDialog.areaId);
      toast.success('Area deleted successfully');
      loadAreas();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete area';
      toast.error(message);
    } finally {
      setDeleteLoading(null);
      setConfirmDialog({ isOpen: false, areaId: null, areaName: '', customerCount: 0 });
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fresh-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dairy-600">Loading areas...</p>
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
            Areas & Zones Master Data
          </h1>
          <p className="text-dairy-600">Manage delivery areas and zones</p>
        </div>
        <button
          onClick={handleAddArea}
          className="btn-primary flex items-center gap-2 w-full lg:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>Add Area</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dairy-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="input pl-12"
              placeholder="Search by area name or code..."
            />
          </div>
        </div>

        <div className="card">
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status as any);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-fresh-green text-white shadow-lg'
                    : 'bg-dairy-100 text-dairy-700 hover:bg-dairy-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {areas.map((area) => (
          <div key={area.id} className="card hover:shadow-2xl transform transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-fresh-green to-fresh-lime rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{area.name}</h3>
                    <p className="text-sm text-dairy-600">{area.code}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      area.is_active
                        ? 'bg-fresh-mint text-fresh-green'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {area.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  {area.customer_count !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-dairy-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {area.customer_count} {area.customer_count === 1 ? 'Customer' : 'Customers'}
                      </span>
                    </div>
                  )}
                  {area.description && (
                    <p className="text-sm text-dairy-600">{truncateText(area.description, 100)}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-dairy-100">
                  <button
                    onClick={() => handleEditArea(area)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-fresh-mint text-fresh-green rounded-lg hover:bg-fresh-green hover:text-white transition-all duration-200 text-sm font-semibold"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => openDeleteDialog(area)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 text-sm font-semibold"
                    disabled={deleteLoading === area.id}
                  >
                    {deleteLoading === area.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {areas.length === 0 && (
        <div className="card text-center py-12">
          <MapPin className="w-16 h-16 text-dairy-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No areas found</h3>
          <p className="text-dairy-600 mb-4">
            {search ? 'Try adjusting your search' : 'Get started by adding your first area'}
          </p>
          {!search && statusFilter === 'all' && (
            <button onClick={handleAddArea} className="btn-primary mx-auto">
              <Plus className="w-5 h-5 inline mr-2" />
              Add Area
            </button>
          )}
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

      {/* Area Modal */}
      <AreaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        area={selectedArea}
        mode={modalMode}
      />

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Area</h3>
                <p className="text-gray-600">
                  Are you sure you want to delete <strong>{confirmDialog.areaName}</strong>?
                  {confirmDialog.customerCount && confirmDialog.customerCount > 0 ? (
                    <span className="block mt-2 text-red-600 font-medium">
                      Warning: This area has {confirmDialog.customerCount} active{' '}
                      {confirmDialog.customerCount === 1 ? 'customer' : 'customers'}. Please reassign
                      them first.
                    </span>
                  ) : (
                    <span className="block mt-2">This action cannot be undone.</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() =>
                  setConfirmDialog({ isOpen: false, areaId: null, areaName: '', customerCount: 0 })
                }
                className="btn-secondary flex-1"
                disabled={deleteLoading !== null}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteArea}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                disabled={deleteLoading !== null}
              >
                {deleteLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </span>
                ) : (
                  'Delete Area'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Areas;
