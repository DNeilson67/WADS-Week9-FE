import { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { IoIosWarning } from 'react-icons/io';
import InputForm from '../components/inputForm';
import Button from '../components/button';
import Modal from '../components/modal';
import { signInWithCustomToken, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, signInWithGoogle, regisNewUser } from '../firebase';
import GoogleButton from '../components/googleButton';
import axios from 'axios'
import { useCookies } from 'react-cookie';
import { API_URL } from '../App';

axios.defaults.withCredentials = true

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const navigate = useNavigate()
  
  async function handleWhoAmI() {
    try {
      const response = await axios.get(API_URL + "/whoami")
      if (response) {
        return true
      }
      return false
    } catch (error) {
      console.error("Error while checking session:", error);
      return false
      // Handle error, such as displaying an error message
    }
  }
  
  useEffect(() => {
    handleWhoAmI().then((whoami) => {
      if (whoami) {
        console.log("yessir")
        navigate("/todo")
      }
    })
  
  }, []);

  function handleChangeMode(e) {
    e.preventDefault();
    setIsRegister(!isRegister);
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password).then(axios.get(API_URL + `/verifyUser`, {params: {email: email, password: password}})
        .then((response) => {
          const user_id = response.data['id'];
          axios.post(API_URL + `/create_session/${user_id}`)
            .then((response) => {
              console.log(response);
              navigate("/todo")
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        }));
    } catch (err) {
      document.getElementById('error_modal').showModal();
      console.log(err)
    }
  }

  async function handleAddAccountToDB(email, password, username) {
    axios.post(API_URL + "/createUser", { id: 0, email: email, password: password, username: username }).then(function (response) {
      
    })
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    try {
      // Register the new user
      await regisNewUser(e, auth, email, password, username).then(handleAddAccountToDB(email, password, username));
      await axios.get(API_URL + `/verifyUser/`, {params: {email: email, password: password}})
        .then((response) => {
          const user_id = response.data['id'];
          axios.post(API_URL + `/create_session/${user_id}`)
            .then((response) => {
              console.log(response);
            })
            .catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        });
      window.location.href = "/todo";

    } catch (err) {
      document.getElementById('error_modal').showModal();
      console.log(err);
    }
  }

  async function handleGoogleSubmit(e) {
    e.preventDefault();
    try {
      await signInWithGoogle(e);
    } catch (err) {
      alert(err);
    }
  }

  async function handleDeleteSession(e) {
    e.preventDefault();
    try {
      const response = await axios.get(API_URL + "/delete_session", {
        withCredentials: true // Ensure cookies are sent with the request
      }).then(
        (response) => {
          console.log(response)
        }
      )
    }
    catch (err) {
      console.log(err)
    }
  }

  return (
    <>
      <div className="flex justify-center items-center h-screen w-screen">
        <div style={{ borderColor: "#788CDE" }} className="border-t-8 rounded-sm bg-white p-9 shadow-2xl w-96">

          {isRegister ? (<>
            <form className='flex flex-col gap-4'>
              <h1 className="font-bold text-center block text-2xl">Sign Up</h1>
              <InputForm type={"email"} value={email} label={"Email Address"} onChange={(e) => setEmail(e.target.value)} />
              <InputForm type={"password"} value={password} label={"Password"} onChange={(e) => setPassword(e.target.value)} />
              <InputForm type={"text"} value={username} label={"Username"} onChange={(e) => setUsername(e.target.value)} />
              <Button value="Sign up" handleSubmit={handleRegisterSubmit} />

              <GoogleButton text={'Sign up'} onClick={handleGoogleSubmit} />
              <label className='flex justify-center gap-2'>Have an account?<button className='underline' onClick={handleChangeMode}>Login</button></label></form></>) : (<>
                <form className='flex flex-col gap-4'>
                  <h1 className="font-bold text-center block text-2xl">Log in</h1>
                  <InputForm type={"email"} value={email} label={"Email Address"} onChange={(e) => setEmail(e.target.value)} />
                  <InputForm type={"password"} value={password} label={"Password"} onChange={(e) => setPassword(e.target.value)} />
                  <Button value="Login" handleSubmit={handleLoginSubmit} />
                  <GoogleButton text={'Sign in'} onClick={handleGoogleSubmit} />
                  <label className='flex justify-center gap-2'>Don't have an account?<button className='underline' onClick={handleChangeMode}>Register now</button></label>
                </form>
              </>)}
        </div>
      </div>

      <Modal id="error_modal" title={"Error"} desc={"Invalid Credentials."} />
    </>
  );
}
