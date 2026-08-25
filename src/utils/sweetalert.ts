/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * SweetAlert2 Notification & Dialog Helper
 */

import Swal from 'sweetalert2';

// Toast Mixin
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export const showToast = (
  icon: 'success' | 'error' | 'warning' | 'info',
  title: string
) => {
  return Toast.fire({
    icon,
    title,
  });
};

export const showSuccessAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#047857', // emerald-700
    confirmButtonText: 'Selesai',
    customClass: {
      popup: 'rounded-2xl shadow-xl font-sans',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm shadow-md',
    },
  });
};

export const showErrorAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#e11d48', // rose-600
    confirmButtonText: 'Mengerti',
    customClass: {
      popup: 'rounded-2xl shadow-xl font-sans',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm',
    },
  });
};

export const showConfirmDialog = async (
  title: string,
  text: string,
  confirmButtonText = 'Ya, Lanjutkan',
  confirmButtonColor = '#047857'
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor: '#64748b', // slate-500
    confirmButtonText,
    cancelButtonText: 'Batal',
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl shadow-xl font-sans',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm shadow-md',
      cancelButton: 'px-4 py-2.5 rounded-xl font-semibold text-sm',
    },
  });

  return result.isConfirmed;
};
