import React, { useState } from 'react';
   import { auth, db } from './firebase';
   import { signInWithEmailAndPassword } from 'firebase/auth';
   import { doc, getDoc } from 'firebase/firestore';
   import { useNavigate } from 'react-router-dom';

   const Login = () => {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [error, setError] = useState('');
     const navigate = useNavigate();

     const handleLogin = async (e) => {
       e.preventDefault();
       setError('');
       try {
         await signInWithEmailAndPassword(auth, email, password);
         const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
         if (userDoc.exists()) {
           const userData = userDoc.data();
           if (userData.role === 'landlord') {
             navigate('/landlord-dashboard');
           } else if (userData.role === 'tenant') {
             navigate('/tenant-dashboard');
           }
         }
       } catch (error) {
         setError(error.message);
       }
     };

     return (
       <div className="flex items-center justify-center min-h-screen bg-gray-100">
         <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
           <h2 className="text-2xl font-bold text-center">Login</h2>
           <div className="space-y-4">
             <div>
               <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                 Email
               </label>
               <input
                 type="email"
                 id="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full p-2 border rounded"
                 required
               />
             </div>
             <div>
               <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                 Password
               </label>
               <input
                 type="password"
                 id="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full p-2 border rounded"
                 required
               />
             </div>
             <button
               onClick={handleLogin}
               className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700"
             >
               Login
             </button>
           </div>
           {error && <p className="text-red-500 text-center">{error}</p>}
         </div>
       </div>
     );
   };

   export default Login;