import React, { useState, useRef, DragEvent } from 'react';
import Swal from 'sweetalert2';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    acceptedTypes: string;
    maxSizeMB?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, acceptedTypes, maxSizeMB = 5 }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const processFile = (file: File) => {
        if (!file) return;

        if (file.type !== acceptedTypes) {
            Swal.fire({
                title: 'Tipe File Salah',
                text: 'Hanya file PDF yang didukung.',
                icon: 'error',
                background: '#1f2937',
                color: '#e5e7eb'
            });
            return;
        }

        if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
            Swal.fire({
                title: 'Ukuran File Terlalu Besar',
                text: `Ukuran file tidak boleh melebihi ${maxSizeMB} MB.`,
                icon: 'error',
                background: '#1f2937',
                color: '#e5e7eb'
            });
            return;
        }
        
        onFileSelect(file);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex justify-center items-center w-full px-6 py-10 border-2 border-dashed rounded-md cursor-pointer
                ${isDragging ? 'border-blue-500 bg-gray-700' : 'border-gray-600 hover:border-gray-500'}
                transition-colors duration-200
            `}
        >
            <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-1 text-sm text-gray-400">
                    <span className="font-semibold text-blue-400">Klik untuk upload</span> atau drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF (Maks. {maxSizeMB}MB)</p>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={acceptedTypes}
                onChange={handleFileChange}
            />
        </div>
    );
};

export default FileUpload;