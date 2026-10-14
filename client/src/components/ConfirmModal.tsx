import * as LucideIcons from 'lucide-react';
import { createPortal } from 'react-dom';

type ConfirmModalProps = {
  isOpen: boolean;
  color?:string;
  title?: string;
  icon?:keyof typeof LucideIcons,
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmModal = ({
  isOpen,
  title,
  message ,
  confirmText ,
  cancelText ,
  onConfirm,
  onCancel,
  icon,
  color
}: ConfirmModalProps) => {
  if (!isOpen) return null;
    const IconComponent = icon 
    ? (LucideIcons[icon] as React.ComponentType<{ className?: string }>) 
    : null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-opacity-80 backdrop-blur-sm flex items-center justify-center "
      role="dialog"
      aria-modal="true"
      onClick={onCancel} // clicking outside closes
    >
      <div
        className="bg-gray-100 rounded-xl p-6 shadow-xl w-xs md:w-lg text-center "
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking modal
      >
        <div className='flex items-center h-12 w-12  justify-center mb-2 mx-auto rounded-full bg-gray-100'>
  {/* <LogOut className='h-8 w-8 text-black' /> */} {IconComponent && <div>
    <IconComponent className={`h-8 w-8 text-${color}`}/>
    </div>}
</div>

        <h2 className="text-lg font-semibold text-gray-800  mb-4">
          {title}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-black text-white transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
