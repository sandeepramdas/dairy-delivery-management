import React, { useEffect, useState } from 'react';
import { Search, Plus, Package, Milk, Edit, Trash2, AlertCircle } from 'lucide-react';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';
import ProductModal from '../components/ProductModal';

interface Product {
  id: string;
  product_name: string;
  product_code: string;
  unit: string;
  price_per_unit: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  productId: string | null;
  productName: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    productId: null,
    productName: '',
  });
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [currentPage, search, statusFilter]);

  const loadProducts = async () => {
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
        search: search || undefined,
      };

      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active';
      }

      const response = await productsAPI.getAll(params);
      setProducts(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadProducts();
  };

  const openDeleteDialog = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      productId: product.id,
      productName: product.product_name,
    });
  };

  const handleDeleteProduct = async () => {
    if (!confirmDialog.productId) return;

    setDeleteLoading(confirmDialog.productId);
    try {
      await productsAPI.delete(confirmDialog.productId);
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete product';
      toast.error(message);
    } finally {
      setDeleteLoading(null);
      setConfirmDialog({ isOpen: false, productId: null, productName: '' });
    }
  };

  const getProductIcon = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes('milk')) {
      return <Milk className="w-6 h-6 text-white" />;
    }
    return <Package className="w-6 h-6 text-white" />;
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
          <p className="text-dairy-600">Loading products...</p>
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
            Products Master Data
          </h1>
          <p className="text-dairy-600">Manage your product catalog</p>
        </div>
        <button
          onClick={handleAddProduct}
          className="btn-primary flex items-center gap-2 w-full lg:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
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
              placeholder="Search by product name or code..."
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

      {/* Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {products.map((product) => (
          <div key={product.id} className="card hover:shadow-2xl transform transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-fresh-green to-fresh-lime rounded-xl flex items-center justify-center flex-shrink-0">
                {getProductIcon(product.product_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {product.product_name}
                    </h3>
                    <p className="text-sm text-dairy-600">{product.product_code}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      product.is_active
                        ? 'bg-fresh-mint text-fresh-green'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {product.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-dairy-100 rounded-lg text-xs font-medium text-dairy-700">
                      Unit: {product.unit}
                    </span>
                    <span className="text-lg font-bold text-fresh-green">
                      ₹{product.price_per_unit.toFixed(2)}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-sm text-dairy-600">
                      {truncateText(product.description, 80)}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-dairy-100">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-fresh-mint text-fresh-green rounded-lg hover:bg-fresh-green hover:text-white transition-all duration-200 text-sm font-semibold"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => openDeleteDialog(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 text-sm font-semibold"
                    disabled={deleteLoading === product.id}
                  >
                    {deleteLoading === product.id ? (
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
      {products.length === 0 && (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-dairy-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
          <p className="text-dairy-600 mb-4">
            {search ? 'Try adjusting your search' : 'Get started by adding your first product'}
          </p>
          {!search && statusFilter === 'all' && (
            <button onClick={handleAddProduct} className="btn-primary mx-auto">
              <Plus className="w-5 h-5 inline mr-2" />
              Add Product
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

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        product={selectedProduct}
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product</h3>
                <p className="text-gray-600">
                  Are you sure you want to delete <strong>{confirmDialog.productName}</strong>? This
                  action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() =>
                  setConfirmDialog({ isOpen: false, productId: null, productName: '' })
                }
                className="btn-secondary flex-1"
                disabled={deleteLoading !== null}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                disabled={deleteLoading !== null}
              >
                {deleteLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </span>
                ) : (
                  'Delete Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
