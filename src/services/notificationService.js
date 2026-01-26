import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

export const showAlert = {
  success: (title, text = '', options = {}) => {
    // Remove zIndex from options if present (not supported in newer SweetAlert2)
    const { zIndex, ...cleanOptions } = options;
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#28a745',
      scrollbarPadding: false, // Prevent layout shift when SweetAlert opens/closes
      heightAuto: false, // Avoid height-based layout jumps
      ...cleanOptions,
    });
  },

  error: (title, text = '', options = {}) => {
    // Remove zIndex from options if present (not supported in newer SweetAlert2)
    const { zIndex, ...cleanOptions } = options;
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#dc3545',
      scrollbarPadding: false,
      heightAuto: false,
      ...cleanOptions,
    });
  },

  warning: (title, text = '', options = {}) => {
    // Remove zIndex from options if present (not supported in newer SweetAlert2)
    const { zIndex, ...cleanOptions } = options;
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#ffc107',
      scrollbarPadding: false,
      heightAuto: false,
      ...cleanOptions,
    });
  },

  info: (title, text = '', options = {}) => {
    // Remove zIndex from options if present (not supported in newer SweetAlert2)
    const { zIndex, ...cleanOptions } = options;
    return Swal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonColor: '#17a2b8',
      scrollbarPadding: false,
      heightAuto: false,
      ...cleanOptions,
    });
  },

  loading: (title, text = '', options = {}) => {
    // Remove zIndex from options if present (not supported in newer SweetAlert2)
    const { zIndex, ...cleanOptions } = options;
    return Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
      scrollbarPadding: false,
      heightAuto: false,
      didOpen: () => {
        Swal.showLoading();
      },
      ...cleanOptions,
    });
  },

  processing: (title = 'Processing Action', text = 'Please wait while we complete this request...', options = {}) => {
    // Remove zIndex from options if present (not supported in newer SweetAlert2)
    const { zIndex, ...cleanOptions } = options;
    return Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
      scrollbarPadding: false,
      heightAuto: false,
      didOpen: () => {
        Swal.showLoading();
      },
      ...cleanOptions,
    });
  },

  confirm: (title, text = '', confirmText = 'Yes', cancelText = 'Cancel', options = {}) => {
    // Remove zIndex from options if present (not supported in newer SweetAlert2)
    const { zIndex, ...cleanOptions } = options;
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: {
        container: 'swal2-high-zindex',
        popup: 'swal2-high-zindex-popup',
      },
      scrollbarPadding: false,
      heightAuto: false,
      ...cleanOptions,
    });
  },

  close: () => {
    Swal.close();
  },
};

export const showToast = {
  success: (message) => {
    toast.success(message);
  },

  error: (message) => {
    toast.error(message);
  },

  warning: (message) => {
    toast.warning(message);
  },

  info: (message) => {
    toast.info(message);
  },
};

