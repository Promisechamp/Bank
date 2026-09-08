import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import { authAPI } from '../../api';
import { toast } from 'sonner';
import Modal from '../Modal';
import {
  Loader2,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  Mail,
  Phone,
  Home,
  Calendar,
  Globe,
  Shield,
  UserCheck,
  Camera,
  Trash2,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const UpdateUserModal = ({
  isOpen,
  onClose,
  user,
  onSuccess,
  isAdmin = true,
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    role: 'user',
    status: 'active',
    date_of_birth: '',
    country: '',
    profile_image: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [avatarChanged, setAvatarChanged] = useState(false);

  /*
   * Reset form whenever a different user is opened.
   */
  useEffect(() => {
    if (!user) return;

    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'user',
      status: user.status || 'active',
      date_of_birth: user.date_of_birth || '',
      country: user.country || '',
      profile_image: user.profile_image || '',
    });

    setNewPassword('');
    setError('');
    setAvatarChanged(false);
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError('');
  };

  /*
   * Upload avatar.
   *
   * IMPORTANT:
   * The database is NOT updated here.
   * The user must click Save Changes.
   */
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file || !user?.id) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, WEBP, or GIF image.');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB.');
      e.target.value = '';
      return;
    }

    setUploadingAvatar(true);

    try {
      const filePath = `avatars/${user.id}/profile.jpg`;

      /*
       * Remove previous avatar.
       */
      try {
        await supabase.storage
          .from('avatars')
          .remove([filePath]);
      } catch (deleteError) {
        console.warn(
          'Previous avatar could not be removed:',
          deleteError
        );
      }

      /*
       * Upload new avatar.
       */
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      /*
       * Cache-busting so the new image appears immediately.
       */
      const freshUrl = `${publicUrl}?v=${Date.now()}`;

      setFormData((prev) => ({
        ...prev,
        profile_image: freshUrl,
      }));

      setAvatarChanged(true);
      setError('');

      toast.success('Photo uploaded. Click Save Changes to apply it.');
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error(err.message || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  /*
   * Remove avatar.
   *
   * The database update still happens only when
   * Save Changes is clicked.
   */
  const handleRemoveAvatar = async () => {
    if (!formData.profile_image) return;

    try {
      const match = formData.profile_image.match(
        /\/object\/public\/avatars\/(.+?)(?:\?.*)?$/
      );

      if (match) {
        await supabase.storage
          .from('avatars')
          .remove([match[1]]);
      }
    } catch (err) {
      console.warn('Failed to delete avatar from storage:', err);
    }

    setFormData((prev) => ({
      ...prev,
      profile_image: '',
    }));

    setAvatarChanged(true);
    setError('');

    toast.info('Photo removed. Click Save Changes to apply.');
  };

  /*
   * Save everything.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        ...formData,
      };

      if (newPassword.trim()) {
        updateData.password = newPassword;
      }

      let response;

      if (isAdmin) {
        response = await authAPI.updateUser(user.id, updateData);
      } else {
        response = await authAPI.updateProfile(updateData);
      }

      if (!response.success) {
        setError(response.error || 'Failed to update user.');
        return;
      }

      toast.success(
        `${formData.full_name} updated successfully.`
      );

      setAvatarChanged(false);
      setNewPassword('');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Update user error:', err);
      setError(err.message || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  /*
   * Reusable input styles.
   */
  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10';

  const iconInputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10';

  const labelClass =
    'mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500';

  const FieldIcon = ({ icon: Icon }) => (
    <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
      subtitle={`Manage ${user?.full_name || 'user'}'s account details`}
      size="lg"
      position="bottom"
      showCloseButton
      closeOnOutsideClick={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ─────────────────────────────────────────
            ERROR
        ───────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-red-700">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>

            <div>
              <p className="text-sm font-bold">
                Unable to save changes
              </p>
              <p className="mt-0.5 text-xs text-red-600">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────
            PROFILE HEADER
        ───────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-white bg-gray-100 shadow-lg shadow-gray-900/10">
                {formData.profile_image ? (
                  <img
                    src={formData.profile_image}
                    alt={formData.full_name || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <User className="h-9 w-9 text-gray-400" />
                  </div>
                )}

                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Camera button */}
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border-2 border-white bg-primary-600 text-white shadow-md transition hover:scale-105 hover:bg-primary-700"
                title="Change profile photo"
              >
                <Camera className="h-3.5 w-3.5" />

                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>

            {/* Avatar information */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-extrabold text-gray-900">
                  {formData.full_name || 'User profile'}
                </h3>

                {isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-[10px] font-bold text-primary-700">
                    <Shield className="h-3 w-3" />
                    Admin access
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG, WEBP or GIF · Maximum 2MB
              </p>

              {/* Avatar actions */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {formData.profile_image && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}

                {avatarChanged && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Unsaved photo change
                  </span>
                )}
              </div>
            </div>

            {/* SAVE AVATAR / CHANGES */}
            {avatarChanged && (
              <button
                type="submit"
                disabled={loading || uploadingAvatar}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                Save Changes
              </button>
            )}
          </div>

          {/* Important upload notice */}
          {avatarChanged && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

              <div>
                <p className="text-xs font-bold text-amber-800">
                  Photo uploaded — changes aren't applied yet
                </p>

                <p className="mt-0.5 text-[11px] leading-5 text-amber-700">
                  Click <strong>Save Changes</strong> to apply the new
                  profile photo to this user's account.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────
            PERSONAL INFORMATION
        ───────────────────────────────────────── */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <User className="h-3.5 w-3.5" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-gray-900">
                Personal information
              </h3>
              <p className="text-[11px] text-gray-400">
                Basic details associated with this account
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* Full name */}
            <div>
              <label className={labelClass}>
                Full name *
              </label>

              <div className="relative">
                <FieldIcon icon={User} />

                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={iconInputClass}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>
                Email address *
              </label>

              <div className="relative">
                <FieldIcon icon={Mail} />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={iconInputClass}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>
                Phone number
              </label>

              <div className="relative">
                <FieldIcon icon={Phone} />

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={iconInputClass}
                  placeholder="+1 555 0101"
                />
              </div>
            </div>

            {/* Date of birth */}
            <div>
              <label className={labelClass}>
                Date of birth
              </label>

              <div className="relative">
                <FieldIcon icon={Calendar} />

                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className={iconInputClass}
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label className={labelClass}>
                Country
              </label>

              <div className="relative">
                <FieldIcon icon={Globe} />

                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={iconInputClass}
                  placeholder="United States"
                />
              </div>
            </div>

            {/* Role */}
            {isAdmin && (
              <div>
                <label className={labelClass}>
                  Account role
                </label>

                <div className="relative">
                  <UserCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`${iconInputClass} appearance-none`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            )}

            {/* Status */}
            {isAdmin && (
              <div>
                <label className={labelClass}>
                  Account status
                </label>

                <div className="relative">
                  <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={`${iconInputClass} appearance-none`}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────
            ADDRESS
        ───────────────────────────────────────── */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Home className="h-3.5 w-3.5" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-gray-900">
                Address
              </h3>

              <p className="text-[11px] text-gray-400">
                Mailing or residential address
              </p>
            </div>
          </div>

          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="No 12, Example Street, Florida"
          />

          <p className="mt-1.5 text-[11px] text-gray-400">
            Country is stored separately above.
          </p>
        </div>

        {/* ─────────────────────────────────────────
            SECURITY
        ───────────────────────────────────────── */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Lock className="h-3.5 w-3.5" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-gray-900">
                Account security
              </h3>

              <p className="text-[11px] text-gray-400">
                Change the user's password if necessary
              </p>
            </div>
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`${iconInputClass} pr-11`}
              placeholder="Leave blank to keep current password"
            />

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-primary-600"
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
            <Shield className="h-3.5 w-3.5 shrink-0 text-gray-400" />

            <p className="text-[11px] text-gray-500">
              Leave this field empty to keep the user's current password.
            </p>
          </div>
        </div>

        {/* ─────────────────────────────────────────
            FOOTER
        ───────────────────────────────────────── */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Changes are saved securely
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || uploadingAvatar}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </Modal>
  );
};

export default UpdateUserModal;