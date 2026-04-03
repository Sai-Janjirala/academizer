import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle2, Fingerprint, KeyRound, LogIn, ScanFace, Wifi } from 'lucide-react';
import { API_BASE } from '../config/api';

const MODEL_URL = 'https://unpkg.com/face-api.js@0.22.2/weights';

let modelsPromise;

const loadFaceModels = () => {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
  }
  return modelsPromise;
};

const getDescriptorFromVideo = async (video) => {
  const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return Array.from(detection.descriptor);
};

const pill = 'rounded-2xl px-4 py-3 border shadow-sm transition-all duration-300';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none';
const inputClass =
  'w-full rounded-2xl border-2 border-violet-100 bg-white/90 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-inner focus:border-fuchsia-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-200 transition-all';

const StudentAttendancePortal = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [registrationId, setRegistrationId] = useState('');
  const [pin, setPin] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [sessionPreview, setSessionPreview] = useState(null);

  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [hasFaceProfile, setHasFaceProfile] = useState(false);

  const [step, setStep] = useState('login');
  const [modelsReady, setModelsReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }, [stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (step !== 'register-face' && step !== 'checkin') return;
    let cancelled = false;
    (async () => {
      try {
        await loadFaceModels();
        if (!cancelled) setModelsReady(true);
      } catch {
        if (!cancelled) setMessage({ type: 'err', text: 'Could not load face models. Check your network and refresh.' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step]);

  useEffect(() => {
    if ((step === 'register-face' || step === 'checkin') && modelsReady) {
      startCamera().catch(() => setMessage({ type: 'err', text: 'Camera permission is required for face verification.' }));
    } else {
      stopCamera();
    }
  }, [step, modelsReady, startCamera, stopCamera]);

  const showMsg = (type, text) => setMessage({ type, text });

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/student-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: registrationId.trim(), pin })
      });
      const data = await res.json();
      if (!res.ok) {
        showMsg('err', data.error || 'Login failed');
        return;
      }
      setStudentId(data.studentId);
      setStudentName(data.name || '');
      setHasFaceProfile(!!data.hasFaceProfile);
      if (data.hasFaceProfile) {
        setStep('checkin');
        showMsg('ok', `Hi ${data.name}. Enter your lecture code to mark attendance.`);
      } else {
        setStep('register-face');
        showMsg('ok', 'Register your face once so we can verify you at each lecture.');
      }
    } catch {
      showMsg('err', 'Network error. Is the server running?');
    } finally {
      setBusy(false);
    }
  };

  const previewSession = async () => {
    const code = sessionCode.trim().toUpperCase();
    if (!code) {
      showMsg('err', 'Enter the session code from your teacher.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/attendance-sessions/preview/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        showMsg('err', data.error || 'Invalid code');
        setSessionPreview(null);
        return;
      }
      setSessionPreview(data);
      showMsg('ok', 'Session found — you can mark attendance when ready.');
    } catch {
      showMsg('err', 'Could not verify session code.');
    } finally {
      setBusy(false);
    }
  };

  const registerFace = async () => {
    if (!videoRef.current || !modelsReady) return;
    setBusy(true);
    try {
      const descriptor = await getDescriptorFromVideo(videoRef.current);
      if (!descriptor) {
        showMsg('err', 'No face detected. Face the camera with good lighting.');
        return;
      }
      const res = await fetch(`${API_BASE}/student-auth/register-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, registrationId: registrationId.trim(), pin, faceDescriptor: descriptor })
      });
      const data = await res.json();
      if (!res.ok) {
        showMsg('err', data.error || 'Could not save face profile');
        return;
      }
      setHasFaceProfile(true);
      setStep('checkin');
      showMsg('ok', data.message || 'Face saved. You can now check in to lectures.');
    } catch {
      showMsg('err', 'Something went wrong saving your face profile.');
    } finally {
      setBusy(false);
    }
  };

  const selfCheck = async () => {
    if (!videoRef.current || !modelsReady) return;
    const code = sessionCode.trim().toUpperCase();
    if (!code) {
      showMsg('err', 'Enter the session code first.');
      return;
    }
    setBusy(true);
    try {
      const descriptor = await getDescriptorFromVideo(videoRef.current);
      if (!descriptor) {
        showMsg('err', 'No face detected. Try again.');
        return;
      }
      const res = await fetch(`${API_BASE}/attendance/self-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionCode: code,
          registrationId: registrationId.trim(),
          pin,
          faceDescriptor: descriptor
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showMsg('err', data.error || 'Check-in failed');
        return;
      }
      showMsg('ok', data.message || 'You are marked present for this lecture.');
    } catch {
      showMsg('err', 'Network error during check-in.');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    stopCamera();
    setStudentId('');
    setStudentName('');
    setHasFaceProfile(false);
    setStep('login');
    setSessionCode('');
    setSessionPreview(null);
    setModelsReady(false);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="min-h-screen bg-student-portal-gradient text-slate-800 relative overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-coral-200/60 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-mint-200/50 blur-3xl animate-float-slower" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col px-4 py-10">
        <header className="mb-8 text-center animate-fade-up">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-fuchsia-600 shadow-sm backdrop-blur">
            <Wifi className="h-3.5 w-3.5" />
            Same class Wi‑Fi as teacher
          </p>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Student <span className="text-gradient">Check‑In</span>
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Face verification + PIN.{' '}
            <Link to="/login" className="font-semibold text-violet-600 underline decoration-2 underline-offset-2 hover:text-fuchsia-600">
              Faculty login
            </Link>
          </p>
        </header>

        {message.text && (
          <div
            className={`${pill} mb-6 animate-fade-up ${message.type === 'err' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}
          >
            {message.text}
          </div>
        )}

        {step === 'login' && (
          <form onSubmit={login} className={`${pill} space-y-4 border-violet-100/80 bg-white/85 backdrop-blur-md animate-fade-up`}>
            <div className="flex items-center gap-2 text-violet-700">
              <LogIn className="h-5 w-5" />
              <span className="font-bold">Sign in</span>
            </div>
            <input
              className={inputClass}
              value={registrationId}
              onChange={(e) => setRegistrationId(e.target.value)}
              placeholder="Registration / roll ID"
              autoComplete="username"
              required
            />
            <input
              className={inputClass}
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN from your teacher (4+ digits)"
              autoComplete="current-password"
              required
            />
            <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
              <KeyRound className="h-4 w-4" />
              Continue
            </button>
          </form>
        )}

        {step === 'register-face' && (
          <div className={`${pill} space-y-4 border-amber-100 bg-white/85 backdrop-blur-md animate-fade-up`}>
            <div className="flex items-center gap-2 text-amber-700">
              <Fingerprint className="h-5 w-5" />
              <span className="font-bold">One-time face setup</span>
            </div>
            <p className="text-sm text-slate-600">Center your face in the frame, then save. This replaces PIN-only proof for attendance.</p>
            <div className="overflow-hidden rounded-2xl border-4 border-violet-200 bg-slate-900 shadow-inner">
              <video ref={videoRef} className="aspect-video w-full object-cover mirror-x" playsInline muted />
            </div>
            {!modelsReady && <p className="text-center text-sm text-violet-600">Loading face models…</p>}
            <button type="button" disabled={busy || !modelsReady} onClick={registerFace} className={`${btnPrimary} w-full`}>
              <Camera className="h-4 w-4" />
              Save my face profile
            </button>
            <button type="button" onClick={logout} className="w-full text-sm font-medium text-slate-500 underline">
              Sign out
            </button>
          </div>
        )}

        {step === 'checkin' && (
          <div className={`${pill} space-y-4 border-emerald-100 bg-white/85 backdrop-blur-md animate-fade-up`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <ScanFace className="h-5 w-5" />
                <span className="font-bold">Lecture check-in</span>
              </div>
              <button type="button" onClick={logout} className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-violet-600">
                Sign out
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Logged in as <span className="font-semibold text-slate-900">{studentName}</span>
            </p>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="Session code (e.g. A1B2C3D4)"
                maxLength={12}
              />
              <button type="button" disabled={busy} onClick={previewSession} className="shrink-0 rounded-2xl border-2 border-violet-200 bg-violet-50 px-4 font-semibold text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-50">
                Verify
              </button>
            </div>
            {sessionPreview && (
              <div className="rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-3 text-sm text-teal-900 border border-teal-100">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" />
                  <div>
                    <p className="font-bold">{sessionPreview.classLabel}</p>
                    <p className="text-teal-800/90">
                      Lecture {sessionPreview.lectureNumber}
                      {sessionPreview.subject ? ` · ${sessionPreview.subject}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-hidden rounded-2xl border-4 border-emerald-200 bg-slate-900 shadow-inner">
              <video ref={videoRef} className="aspect-video w-full object-cover mirror-x" playsInline muted />
            </div>
            {!modelsReady && <p className="text-center text-sm text-emerald-600">Loading face models…</p>}
            <button type="button" disabled={busy || !modelsReady} onClick={selfCheck} className={`${btnPrimary} w-full from-emerald-500 to-teal-500`}>
              <ScanFace className="h-4 w-4" />
              Mark present with face
            </button>
            <p className="text-center text-xs text-slate-500">
              Your phone or laptop must be on the same classroom network as your teacher&apos;s computer for this to succeed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendancePortal;
