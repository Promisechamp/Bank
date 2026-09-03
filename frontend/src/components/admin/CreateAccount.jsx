import React, { useState } from 'react';
import Modal from '../Modal';
import { accountsAPI } from '../../api';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const CreateAccount = ({ isOpen, onClose, onSuccess }) => {
  const [accountType, setAccountType] = useState('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await accountsAPI.create({ 
        account_type: accountType 
      });
      
      setSuccess(data.message || 'Account created successfully!');
      
      // Refresh accounts list
      if (onSuccess) {
        await onSuccess();
      }
      
      // Close after delay
      setTimeout(() => {
        onClose();
        setAccountType('checking');
        setSuccess('');
      }, 1500);
      
    } catch (error) {
      setError(error.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Account"
      subtitle="Banking"
      size="md"
      position="bottom"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Account Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Account Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType('checking')}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                accountType === 'checking'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                accountType === 'checking' ? 'bg-primary-100' : 'bg-gray-100'
              }`}>
                <svg className={`h-6 w-6 ${accountType === 'checking' ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-medium">Checking</span>
              <p className="text-xs text-gray-500 mt-1">Everyday spending</p>
            </button>

            <button
              type="button"
              onClick={() => setAccountType('savings')}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                accountType === 'savings'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                accountType === 'savings' ? 'bg-primary-100' : 'bg-gray-100'
              }`}>
                <svg className={`h-6 w-6 ${accountType === 'savings' ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium">Savings</span>
              <p className="text-xs text-gray-500 mt-1">Earn interest</p>
            </button>
          </div>
        </div>

        {/* Account Features Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">You're creating a <span className="font-medium capitalize text-gray-900">{accountType}</span> account</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-500">
            {accountType === 'checking' ? (
              <>
                <li>• Daily transactions & purchases</li>
                <li>• Direct deposit compatible</li>
                <li>• No minimum balance required</li>
              </>
            ) : (
              <>
                <li>• Earn 2.5% APY interest</li>
                <li>• Build your emergency fund</li>
                <li>• No monthly maintenance fees</li>
              </>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAccount;