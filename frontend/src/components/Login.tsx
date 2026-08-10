import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import dentalBg from '../assets/dental_background.png';
import logoCurare from '../assets/logo_curare.png';
import Swal from 'sweetalert2';
import './Login.css';
import { useChat } from '../context/ChatContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const navigate = useNavigate();
    const { loginUser } = useChat();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Update chat context with new user
            loginUser(response.data.user);

            navigate('/');
        } catch (error: any) {
            console.error('Login error:', error);
            if (error.response && error.response.data && error.response.data.message) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de Inicio de Sesión',
                    text: error.response.data.message
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de Inicio de Sesión',
                    text: 'Credenciales incorrectas o error de conexión'
                });
            }
        }
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/auth/forgot-password', { email: forgotEmail });
            await Swal.fire({
                icon: 'info',
                title: 'Correo Enviado',
                text: 'Se ha enviado una nueva contraseña a tu correo.'
            });
            setShowForgot(false);
            setForgotEmail('');
        } catch (error) {
            console.error('Forgot password error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al procesar la solicitud.'
            });
        }
    };

    return (
        <div className="login-container" style={{ backgroundImage: `url(${dentalBg})` }}>
            <div className="login-overlay"></div>
            <div className="login-card">
                <div className="login-logo-container">
                    <img src={logoCurare} alt="Curare Centro Dental" className="login-logo" />
                </div>
                <h2 className="login-title">Bienvenido</h2>
                <p className="login-subtitle">Ingresa a tu cuenta</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Correo Electrónico</label>
                        <div className="input-icon-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <input
                                type="email"
                                className="form-input with-icon"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="ejemplo@correo.com"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <div className="input-icon-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <input
                                type="password"
                                className="form-input with-icon"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 mt-4">
                        Iniciar Sesión
                    </button>
                    <div style={{ marginTop: '15px', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setShowForgot(true)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors bg-transparent border-none cursor-pointer underline"
                        >
                            Olvidé mi Contraseña
                        </button>
                    </div>
                </form>
            </div>

            {/* Forgot Password Modal */}
            {showForgot && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0, color: '#2c3e50', textAlign: 'center' }}>Recuperar Contraseña</h3>
                        <p style={{ color: '#7f8c8d', marginBottom: '20px', textAlign: 'center' }}>
                            Ingresa tu correo electrónico para recibir una nueva contraseña.
                        </p>
                        <form onSubmit={handleForgotSubmit}>
                            <div className="form-group">
                                <label className="form-label">Correo Electrónico</label>
                                <div className="input-icon-wrapper">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    <input
                                        type="email"
                                        className="form-input with-icon"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        required
                                        placeholder="ejemplo@correo.com"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="login-button" style={{ marginBottom: '10px' }}>
                                Enviar
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForgot(false)}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc',
                                    backgroundColor: 'white', color: '#7f8c8d', cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
