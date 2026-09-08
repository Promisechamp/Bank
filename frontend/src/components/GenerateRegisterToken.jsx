import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Modal from './Modal';
import {
  Loader2,
  Plus,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  AlertCircle,
  Calendar,
  Link as LinkIcon,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

const GenerateRegisterToken = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Generate modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [generatingToken, setGeneratingToken] = useState(false);

  // Get base URL for registration links
  const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_APP_URL || import.meta.env.VITE_BASE_URL;
    if (envUrl) return envUrl;
    return window.location.origin;
  };

  // ------------------------------------------------------------
  // Fetch tokens
  // ------------------------------------------------------------
  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getRegisterTokens();
      setTokens(response.tokens || []);
    } catch (error) {
      console.error('Failed to load tokens:', error);
      toast.error('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Open generate modal
  // ------------------------------------------------------------
  const openGenerateModal = () => {
    // Default to 7 days from now (local time)
    const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const localDate = defaultExpiry.toISOString().slice(0, 16);
    setExpiryDate(localDate);
    setGenerateModalOpen(true);
  };

  // ------------------------------------------------------------
  // Generate token with custom expiry (FIXED timezone)
  // ------------------------------------------------------------
  const handleGenerateWithExpiry = async () => {
    if (!expiryDate) {
      toast.error('Please select an expiry date and time');
      return;
    }

    const selectedLocal = new Date(expiryDate);
    if (selectedLocal <= new Date()) {
      toast.error('Expiry date must be in the future');
      return;
    }

    // Convert local datetime to UTC ISO string
    const utcExpiry = selectedLocal.toISOString(); // e.g. "2025-03-15T07:36:00.000Z"

    setGeneratingToken(true);
    try {
      await adminAPI.generateRegisterToken(utcExpiry);
      toast.success('New registration token generated!');
      setGenerateModalOpen(false);
      await fetchTokens();
    } catch (error) {
      toast.error(error?.message || error?.error || 'Failed to generate token');
    } finally {
      setGeneratingToken(false);
    }
  };

  // ------------------------------------------------------------
  // Open delete modal
  // ------------------------------------------------------------
  const openDeleteModal = (token) => {
    setTokenToDelete(token);
    setDeleteModalOpen(true);
  };

  // ------------------------------------------------------------
  // Confirm delete (hard delete)
  // ------------------------------------------------------------
  const confirmDelete = async () => {
    if (!tokenToDelete) return;

    setModalLoading(true);
    try {
      await adminAPI.revokeRegisterToken(tokenToDelete.token);
      toast.success('Token deleted');
      setTokens(prev => prev.filter(item => item.id !== tokenToDelete.id));
      setDeleteModalOpen(false);
      setTokenToDelete(null);
    } catch (error) {
      toast.error(error?.message || error?.error || 'Failed to delete token');
    } finally {
      setModalLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Copy
  // ------------------------------------------------------------
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  // ------------------------------------------------------------
  // Token status
  // ------------------------------------------------------------
  const getStatusBadge = (token) => {
    if (token.used) {
      return {
        label: 'Used',
        color: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: CheckCircle,
      };
    }

    if (new Date(token.expires_at) < new Date()) {
      return {
        label: 'Expired',
        color: 'bg-red-50 text-red-600 border-red-100',
        icon: XCircle,
      };
    }

    return {
      label: 'Active',
      color: 'bg-green-50 text-green-600 border-green-100',
      icon: CheckCircle,
    };
  };

  const isActive = (token) => !token.used && new Date(token.expires_at) > new Date();

  const baseUrl = getBaseUrl();

  // ------------------------------------------------------------
  // Initial load
  // ------------------------------------------------------------
  useEffect(() => {
    fetchTokens();
  }, []);

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Registration Tokens</h1>
            {!loading && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                {tokens.length}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Generate and manage secure registration links
          </p>
        </div>

        <button
          onClick={openGenerateModal}
          disabled={generating}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span>{generating ? 'Generating...' : 'Generate New Token'}</span>
        </button>
      </div>

      {/* ======================================================
          TOKENS
      ====================================================== */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex justify-center items-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Loading tokens...</p>
          </div>
        </div>
      ) : tokens.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <LinkIcon className="h-6 w-6 text-gray-300" />
          </div>
          <p className="font-medium text-gray-700">No registration tokens</p>
          <p className="text-sm text-gray-400 mt-1">
            Generate a token to create a secure registration link.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token, index) => {
            const status = getStatusBadge(token);
            const StatusIcon = status.icon;
            const active = isActive(token);
            const registrationUrl = `${baseUrl}/secure-register-page?securetoken=${token.token}`;

            return (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={`
                  group bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
                  ${active ? 'border-gray-200 hover:border-primary-200' : 'border-gray-100'}
                `}
              >
                {/* Card header */}
                <div className="px-5 pt-5">
                  <div className="flex items-center justify-between">
                    <div
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium
                        ${status.color}
                      `}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      <span>{status.label}</span>
                    </div>

                    <button
                      onClick={() => openDeleteModal(token)}
                      disabled={deleting === token.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete token"
                    >
                      {deleting === token.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                
                {/* Registration link */}
                <div className="px-5 mt-4">
                  <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    Registration Link
                  </p>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1.5">
                    <code className="text-xs text-primary-600 truncate flex-1 font-mono px-1">
                      {registrationUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(registrationUrl)}
                      className="p-1.5 rounded-md hover:bg-white text-gray-500 hover:text-primary-600 transition-colors"
                      title="Copy full link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="px-5 mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      Created
                    </span>
                    <span className="text-gray-600">{formatDate(token.created_at)}</span>
                  </div>
                  <div className="pb-5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      Expires
                    </span>
                    <span
                      className={
                        !token.used && new Date(token.expires_at) < new Date()
                          ? 'text-red-500'
                          : 'text-gray-600'
                      }
                    >
                      {formatDate(token.expires_at)}
                    </span>
                  </div>
                </div>


              </motion.div>
            );
          })}
        </div>
      )}

      {/* ==========================================================
          GENERATE TOKEN MODAL
      ========================================================== */}
      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Generate Registration Token"
        subtitle="Set the expiry date and time for this token"
        size="md"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date & Time
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Choose a future date and time. The token will expire at this moment.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setGenerateModalOpen(false)}
              disabled={generatingToken}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateWithExpiry}
              disabled={generatingToken || !expiryDate}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {generatingToken ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{generatingToken ? 'Generating...' : 'Generate Token'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ==========================================================
          DELETE CONFIRMATION MODAL
      ========================================================== */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Registration Token"
        size="sm"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        {tokenToDelete && (
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-full bg-red-50 flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete this token?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This action cannot be undone. The registration link will no longer work.
                </p>
                <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Token</p>
                  <code className="text-sm font-mono text-gray-800 break-all">{tokenToDelete.token}</code>
                  <p className="text-xs text-gray-500 mt-2">
                    Status:{' '}
                    <span className={`font-medium ${getStatusBadge(tokenToDelete).color}`}>
                      {getStatusBadge(tokenToDelete).label}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={modalLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={modalLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {modalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>{modalLoading ? 'Deleting...' : 'Delete Token'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default GenerateRegisterToken;