import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X, User } from 'lucide-react';

interface PacienteFotoProps {
    foto?: string; // Existing photo filename or URL
    onPhotoSelected: (file: File | Blob | null) => void;
}

const PacienteFoto: React.FC<PacienteFotoProps> = ({ foto, onPhotoSelected }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "user"
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
                onPhotoSelected(file);
            };
            reader.readAsDataURL(file);
        }
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setPreview(imageSrc);
            // Convert base64 to Blob
            fetch(imageSrc)
                .then(res => res.blob())
                .then(blob => onPhotoSelected(blob));
            setIsCameraOpen(false);
        }
    }, [webcamRef, onPhotoSelected]);

    const clearPhoto = () => {
        setPreview(null);
        onPhotoSelected(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="text-center w-full">
                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-1">Foto del Paciente</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Opcional. Se mostrará en el perfil del paciente.</p>
            </div>

            {isCameraOpen ? (
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg bg-black">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                        <button
                            type="button"
                            onClick={capture}
                            className="bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700"
                            title="Tomar Foto"
                        >
                            <Camera size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCameraOpen(false)}
                            className="bg-gray-500 text-white p-2 rounded-full shadow-md hover:bg-gray-600"
                            title="Cancelar"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            ) : preview ? (
                <div className="relative w-48 h-48 rounded-full border-4 border-gray-200 dark:border-gray-600 shadow-lg group">
                    <img src={preview} alt="Vista previa" className="w-full h-full object-cover rounded-full" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center gap-3">
                        <button type="button" onClick={clearPhoto} className="text-white hover:text-red-400" title="Quitar foto">
                            <X size={28} />
                        </button>
                    </div>
                </div>
            ) : foto ? (
                <div className="relative w-48 h-48 rounded-full border-4 border-gray-200 dark:border-gray-600 shadow-lg group bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    <img src={`http://localhost:3000/pacientes/foto/file/${foto}`} alt="Foto paciente" className="w-full h-full object-cover rounded-full" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                        <button type="button" onClick={clearPhoto} className="text-white hover:text-red-400 flex flex-col items-center">
                            <X size={24} />
                            <span className="text-xs font-bold mt-1">Cambiar</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-48 h-48 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 shadow-sm">
                    <User size={48} className="mb-2 opacity-50" />
                    <span className="text-xs font-medium px-4 text-center">Sin foto</span>
                </div>
            )}

            {!isCameraOpen && !preview && (
                <div className="flex flex-wrap justify-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm"
                        title="Usar cámara web de la computadora"
                    >
                        <Camera size={18} /> Webcam PC
                    </button>
                    
                    <label 
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors cursor-pointer font-medium text-sm"
                        title="Abrir cámara del celular/tablet"
                    >
                        <Camera size={18} /> Cámara Móvil
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>

                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer font-medium text-sm">
                        <Upload size={18} /> Subir
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
            )}
        </div>
    );
};

export default PacienteFoto;
