import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth, db, storage } from '../firebase';
import MobileNav from '../components/MobileNav';
import Sidebar from '../components/Sidebar';
import { tenantNavItems } from '../constants/navItems';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AlertModal from '../components/AlertModal';

export default function TenantDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [landlordEmail, setLandlordEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [property, setProperty] = useState(null);
  const [lease, setLease] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [unread, setUnread] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [alertMessage, setAlertMessage] = useState('');

  const HELLOSIGN_API_KEY =
    'f91934661f9c4374956ba03c3d2997ad15835e9e250f68ddccbe903dd1ec3344';
  const HELLOSIGN_CLIENT_ID = 'f75682d32e0636b575853424f08d1e38';

  const userFirstName = sessionStorage.getItem('user_first_name');
  const userEmail = sessionStorage.getItem('user_email');

  const navItems = tenantNavItems({ active: 'dashboard', unread, unreadMessages });

  useEffect(() => {
    const fetchUserStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/signin');
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'Users', user.uid));
        if (snap.exists()) {
          const userData = snap.data();
          sessionStorage.setItem('user_first_name', userData.first_name);
          sessionStorage.setItem('user_email', userData.email);
          setStatus(userData.status || 'Inactive');
        } else {
          setStatus('Inactive');
        }
      } catch (err) {
        console.error('Failed to fetch user data', err);
        setStatus('Inactive');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStatus();
    }, [navigate]);

  useEffect(() => {
    let unsubMessages;
    const unsubAuth = auth.onAuthStateChanged((u) => {
      if (unsubMessages) unsubMessages();
      if (u) {
        const q = query(
          collection(db, 'Messages'),
          where('recipientUid', '==', u.uid),
          where('read', '==', false)
        );
        unsubMessages = onSnapshot(q, (snap) => setUnreadMessages(snap.size));
      } else {
        setUnreadMessages(0);
      }
    });
    return () => {
      if (unsubMessages) unsubMessages();
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    const fetchLeaseInfo = async () => {
      if (status !== 'Active') return;
      const user = auth.currentUser;
      if (!user) return;
      let propSnap = await getDocs(
        query(collection(db, 'Properties'), where('tenants', 'array-contains', user.uid))
      );
      if (propSnap.empty) {
        propSnap = await getDocs(query(collection(db, 'Properties'), where('tenant_uid', '==', user.uid)));
      }
      if (!propSnap.empty) {
        const propDoc = propSnap.docs[0];
        const propData = { id: propDoc.id, ...propDoc.data() };
        setProperty(propData);
        const leaseQuery = query(
          collection(db, 'Leases'),
          where('tenant_uid', '==', user.uid),
          where('property_id', '==', propDoc.id)
        );
        const leaseSnap = await getDocs(leaseQuery);
        if (!leaseSnap.empty) {
          const leaseDoc = leaseSnap.docs[0];
          setLease({ id: leaseDoc.id, ...leaseDoc.data() });
        }
      }
    };
    fetchLeaseInfo();
  }, [status]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const handleSignLease = async () => {
    if (!lease) return;
    const user = auth.currentUser;
    if (!user) return;
    if (!HELLOSIGN_API_KEY || !HELLOSIGN_CLIENT_ID) {
      console.error('HelloSign API credentials are not configured.');
      setUploadMessage('Unable to initiate signing at this time.');
      return;
    }
    try {
      const data = new URLSearchParams();
      data.append('test_mode', '1');
      data.append('client_id', HELLOSIGN_CLIENT_ID);
      data.append('signers[0][email_address]', userEmail || user.email || '');
      data.append('signers[0][name]', userFirstName || 'Tenant');
      data.append(
        'file_url',
        'https://forms.mgcs.gov.on.ca/dataset/edff7620-980b-455f-9666-643196d8312f/resource/44548947-1727-4928-81df-dfc33ffd649a/download/2229e_flat.pdf',
      );

      const resp = await fetch('https://api.hellosign.com/v3/signature_request/create_embedded', {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(HELLOSIGN_API_KEY + ':'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data,
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to create signature request: ${errorText}`);
      }
      const json = await resp.json();
      const signatureId = json.signature_request.signatures[0].signature_id;
      const signatureRequestId = json.signature_request.signature_request_id;

      const signUrlResp = await fetch(
        `https://api.hellosign.com/v3/embedded/sign_url/${signatureId}`,
        { headers: { Authorization: 'Basic ' + btoa(HELLOSIGN_API_KEY + ':') } }
      );
      const signUrlJson = await signUrlResp.json();
      const signUrl = signUrlJson.embedded.sign_url;

      // Helper to download the signed PDF from HelloSign and persist it in Firebase Storage
      const saveSignedAgreement = async () => {
        try {
          const fileResp = await fetch(
            `https://api.hellosign.com/v3/signature_request/files/${signatureRequestId}?file_type=pdf&get_url=1`,
            { headers: { Authorization: 'Basic ' + btoa(HELLOSIGN_API_KEY + ':') } }
          );
          if (!fileResp.ok) throw new Error('Failed to fetch signed file');
          const { file_url: fileUrl } = await fileResp.json();
          const pdfResp = await fetch(fileUrl);
          const blob = await pdfResp.blob();
          const fileRef = ref(storage, `signed_leases/${lease.id}.pdf`);
          await uploadBytes(fileRef, blob, { contentType: 'application/pdf' });
          const url = await getDownloadURL(fileRef);
          await updateDoc(doc(db, 'Leases', lease.id), { signed_agreement_url: url });
          setLease((prev) => ({ ...prev, signed_agreement_url: url }));
          setUploadMessage('Agreement signed successfully.');
        } catch (err) {
          console.error('Failed to save signed agreement', err);
        }
      };

      const ensureHelloSign = () =>
        new Promise((resolve, reject) => {
          const SCRIPT_SRC =
            'https://cdn.hellosign.com/public/js/embedded/v2.3.1/embedded.production.min.js';

          const start = Date.now();
          const timeout = 30000; // wait up to 30s before failing

          const check = () => {
            if (window.HelloSign && window.HelloSign.open) {
              resolve(window.HelloSign);
            } else if (Date.now() - start > timeout) {
              reject(new Error('Failed to load HelloSign script'));
            } else {
              setTimeout(check, 500);
            }
          };

          const inject = () => {
            let script = document.querySelector('script[data-hs-embed]');
            if (!script) {
              script = document.createElement('script');
              script.src = SCRIPT_SRC;
              script.async = true;
              script.dataset.hsEmbed = 'true';
              script.onerror = () => {
                script.remove();
                setTimeout(inject, 1000);
              };
              document.body.appendChild(script);
            }
          };

          inject();
          check();
        });

      const openHelloSign = async () => {
        try {
          const hs = await ensureHelloSign();
          const handleSign = async () => {
            await saveSignedAgreement();
            hs.off('sign', handleSign);
          };
          hs.on('sign', handleSign);
          hs.open({
            url: signUrl,
            clientId: HELLOSIGN_CLIENT_ID,
            skipDomainVerification: true,
          });
        } catch (e) {
          console.error('HelloSign script failed to load', e);
          setUploadMessage('Unable to load signing component. Please try again.');
        }
      };

      await openHelloSign();
    } catch (err) {
      console.error('Error initiating HelloSign', err);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !landlordEmail.trim()) return;

    try {
      setSendingRequest(true);
      await addDoc(collection(db, 'TenantRequests'), {
        tenant_uid: user.uid,
        landlord_email: landlordEmail.trim().toLowerCase(),
        status: 'Pending',
        created_at: serverTimestamp(),
      });

      await updateDoc(doc(db, 'Users', user.uid), {
        status: 'Pending',
      });

      setRequestSent(true);
      setStatus('Pending');
    } catch (err) {
      console.error('Error sending request:', err);
      setAlertMessage('Failed to send request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const Header = () => (
      <header className="bg-gradient-to-tr from-purple-700 to-blue-500 text-white fixed w-full z-30 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full flex items-center justify-between px-2 md:px-4 lg:px-6 py-4 max-w-none">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>EasyLease</h1>
          <div className="hidden md:flex items-center space-x-6">
            {userFirstName && (
              <span className="font-medium text-white dark:text-gray-100">{userFirstName}</span>
            )}
            <button
              className="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white hover:scale-105 transform transition dark:from-gray-700 dark:to-gray-900"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
          <MobileNav navItems={navItems} handleLogout={handleLogout} />
      </div>
    </header>
  );

  if (status === 'Inactive') {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-4 pt-20">
          <div className="bg-yellow-100 border-l-4 border-yellow-600 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-100 p-6 rounded-lg max-w-lg text-center shadow space-y-4">
            <div className="text-3xl">⚠️</div>
            <h2 className="text-lg font-bold">You're not yet assigned to a property.</h2>
            <p>Please ask your landlord for their email and enter it below:</p>

            {requestSent ? (
              <p className="text-green-600 dark:text-green-400 font-medium">Request sent! Please wait for your landlord to approve it.</p>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Landlord Email"
                  value={landlordEmail}
                  onChange={(e) => setLandlordEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded border dark:border-gray-600 dark:bg-gray-800"
                />
                <button
                  type="submit"
                  disabled={sendingRequest}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {sendingRequest ? 'Sending...' : 'Send Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </>
    );
  }

  if (status === 'Pending') {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-4 pt-20">
          <div className="bg-yellow-100 border-l-4 border-yellow-600 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-100 p-6 rounded-lg max-w-lg text-center shadow space-y-3">
            <div className="text-3xl">⏳</div>
            <h2 className="text-lg font-bold">Request Pending</h2>
            <p>Your request has been sent. Please wait for your landlord to approve it.</p>
          </div>
        </div>
      </>
    );
  }

  // Active dashboard rendering below...



    return (
      <div className="min-h-screen flex flex-col antialiased text-gray-800 bg-white dark:bg-gray-900 dark:text-gray-100">
        <Header />

        <div className="flex flex-1 pt-20 min-h-[calc(100vh-5rem)]">
        <Sidebar navItems={navItems} firstName={userFirstName} user={{ email: userEmail }} />

          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-6 overflow-y-auto space-y-8">
              {/* Render main dashboard (Active tenant) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Property</h3>
                <p className="text-2xl font-semibold mt-2 dark:text-gray-100">{property ? property.name : 'N/A'}</p>
                {property && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{property.address_line1}</p>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Lease Period</h3>
                {lease ? (
                  <>
                    <p className="text-2xl font-semibold mt-2 dark:text-gray-100">
                      {lease.start_date} – {lease.end_date}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rent: ${lease.rent_amount}</p>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">N/A</p>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Security Deposit</h3>
                <p className="text-2xl font-semibold mt-2 dark:text-gray-100">{lease ? `$${lease.security_deposit}` : 'N/A'}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">Lease Agreement</h3>
                <motion.a
                  href="https://forms.mgcs.gov.on.ca/dataset/edff7620-980b-455f-9666-643196d8312f/resource/44548947-1727-4928-81df-dfc33ffd649a/download/2229e_flat.pdf"
                  className="mt-2 inline-block px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded shadow hover:from-purple-600 hover:to-indigo-500"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Download Standard Lease
                </motion.a>
              <div className="mt-4">
                {lease ? (
                  lease.signed_agreement_url ? (
                    <motion.a
                      href={lease.signed_agreement_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded shadow hover:from-emerald-600 hover:to-green-500"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Signed Agreement
                    </motion.a>
                  ) : (
                    <>
                      <motion.button
                        onClick={handleSignLease}
                        className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded shadow hover:from-purple-600 hover:to-indigo-500"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Sign Lease
                      </motion.button>
                      {uploadMessage && (
                        <p className="mt-2 text-green-600 dark:text-green-400">{uploadMessage}</p>
                      )}
                    </>
                  )
                ) : null}
              </div>
            </div>
          </main>
      </div>
      </div>
      <AlertModal message={alertMessage} onClose={() => setAlertMessage('')} />
    </div>
  );
}
