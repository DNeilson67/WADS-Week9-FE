// App.js
import { useEffect, useState } from 'react';
import { CiLogout } from "react-icons/ci";
import { IoSettings } from 'react-icons/io5';
import './App.css';
import AddForm from '../components/addForm';
import Profile from '../components/profile';
import { db, auth } from '../firebase';
import { collection, addDoc, setDoc, getCountFromServer, doc, onSnapshot, query, deleteDoc, getDoc, where, getDocs } from 'firebase/firestore';
import Modal from '../components/modal';
import { Link } from "react-router-dom";
import { onAuthStateChanged } from 'firebase/auth';
import ProfileDropDown from '../components/profileDropDown';
import profileDropDown from '../components/profileDropDown';
import { settings } from 'firebase/analytics';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import { API_URL } from '../App';

function App() {

  const [todos, setTodos] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  // const [userDocID, setUserDocID] = useState(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState(false);
  const [cookies, setCookie] = useCookies(['themeMode']);

  function handleThemeMode() {
    const newThemeMode = !themeMode; // Negate the current value to get the new value
    setThemeMode(newThemeMode); // Update the state
    setCookie("themeMode", newThemeMode); // Set the cookie with the new value
  }

  async function getUserDocID() {
    const user = auth.currentUser;
    if (!user) {
      console.log("User not authenticated.");
      return null;
    }

    const q = query(collection(db, "users"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.size === 0) {
      console.log("No matching documents found.");
      return null;
    }

    return querySnapshot.docs[0].id;
  }

  async function handleWhoAmI() {
    try {
      const response = await axios.get(API_URL + "/whoami", {
        withCredentials: true // Ensure cookies are sent with the request
      });

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
    handleWhoAmI().then((whoami) => {if (whoami) {
      setThemeMode(cookies.themeMode)
      axios.get(API_URL + "/getAllTasks").then((response) => {
        const tasks = Object.entries(response.data)
        console.log(tasks)
        const taskData = tasks.map(task => {
          return {
            completed: task[1].completed,
            title: task[1].title,
            task_id: task[1].task_id
          };
        });
        setTodos(taskData)
      })} else document.getElementById("not_signed_in").showModal();
    })
    
  }, [todos]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(true);
      } else {
        setLoading(false);
        setProfilePicURL(user.photoURL || "");
        setNewUsername(user.displayName)
      }
    });

    return () => unsubscribe();
  }, []);


  async function handleSubmit(e) {
    e.preventDefault();
    if (newItem === '') {
      document.getElementById('my_modal_1').showModal();
    } else {
      axios.post(API_URL + "/createTask", { task_id: 0, title: newItem, completed: false }).then(function (response) {
        console.log(response)
      })
      todos.push({ title: newItem, completed: false })
      setNewItem('');
    }
  }

  async function deleteTodo(task_id) {
    try {
      axios.delete(API_URL + `/deleteTaskID/${task_id}`).then(function (response) {
        console.log(response)
      })
      setTodos((currentTodos) =>
        currentTodos.filter((todo) => todo.task_id !== task_id)
      );
    } catch (err) {
      alert(err);
    }
  }

  function filterTodoCompleted(bool) {
    setShowCompleted(bool);
  }

  async function toggleTodo(task_id, completed) {
    axios.put(API_URL + `/updateCompletion/${task_id}`, { completed: completed }).then((response) => {
      console.log(response);
    }).catch((err) => {
      console.log(err)
    });
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.task_id === task_id ? { ...todo, completed } : todo
      )
    );
  }

  function handleEdit(task_id) {
    const todoToEdit = todos.find((todo) => todo.task_id === task_id);
    setEditingTodo(todoToEdit);
  }

  async function handleEditSubmit() {
    // try {
    //   await setDoc(doc(db, 'users', userDocID, 'todoTasks', editingTodo.task_id), {
    //     title: editingTodo.title,
    //     completed: editingTodo.completed
    //   });
    //   setEditingTodo(null);
    // } catch (err) {
    //   alert(err);
    // }
  }

  function cancelEdit() {
    setEditingTodo(null);
  }

  async function handleDeleteSession() {
    try {
      const response = await axios.delete(API_URL + "/delete_session", {
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


  function logOut() {
    // TO-DO: FastAPI SignOut using HandleDeleteSession
    handleDeleteSession();
    auth.signOut();
    window.location.href = "/";
  }

  const filteredTodos = showCompleted ? todos.filter((todo) => todo.completed) : todos;

  // console.log(auth.currentUser)
  return (
    <>
      <div className="drawer lg:drawer-open">
        <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col m-8">
          <AddForm newItem={newItem} setNewItem={setNewItem} handleSubmit={handleSubmit} />
          {/* <button onClick={handleWhoAmI} className='btn'>WhoAmI?</button> */}
          <div className='flex flex-row gap-4 justify-end m-4'>
            <input
              className='checkbox'
              type="checkbox"
              onChange={(e) => filterTodoCompleted(e.target.checked)}
              checked={showCompleted}
            />
            <span>Completed Tasks</span>
            {/* testing get out from session */}
            {/* <button className='btn' onClick={handleDeleteSession}></button> */}
          </div>
          <ul className="flex-1 flex-row">
            <div className=''>
              {filteredTodos.map((todo, task_id) => (
                <li key={task_id} className='my-2'>
                  <div className='flex items-center justify-between p-4 bg-red-400 rounded-md task'>
                    <div className="flex items-center">
                      <input
                        className='checkbox mr-4'
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.task_id, !todo.completed)}
                      />
                      {/* Edit Input Field / Todo Title */}
                      {editingTodo && editingTodo.task_id === todo.task_id ? (
                        <input
                          className='input text-xl'
                          type="text"
                          value={editingTodo.title}
                          onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                        />
                      ) : (
                        <label className="ml-2 text-xl">{todo.title}</label>
                      )}
                    </div>
                    <div className='justify-between'>
                      {/* Edit/View Mode Todo */}
                      {editingTodo && editingTodo.task_id === todo.task_id ? (
                        <>
                          <button className="btn btn-outline btn-warning mx-4" onClick={cancelEdit}>Cancel</button>
                          <button className="btn btn-primary" onClick={handleEditSubmit}>Save</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-outline btn-warning mx-4" onClick={() => handleEdit(todo.task_id)}>Edit</button>
                          <button className="btn btn-error" onClick={() => deleteTodo(todo.task_id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </div>
          </ul>
        </div>
        <div className="drawer-side">
          <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
          <ul className="menu min-h-full drawer-color text-base-content justify-between">
            <li>
              {loading ? (<ProfileDropDown />) : (<ProfileDropDown email={auth.currentUser.email} username={auth.currentUser.displayName} profpic={auth.currentUser.photoURL} logout={logOut} />)}
            </li>
            <li><div className="form-control flex justify-stretch p-4">
              <span className="label-text">Theme Mode : {themeMode ? "Synthwave" : "Dark"}</span>
              <input type="checkbox" value={themeMode ? "synthwave" : "dark"} className="toggle theme-controller" checked={themeMode} onChange={handleThemeMode} />
            </div></li>
            <li>
              <button className='flex justify-between h-16 text-3xl items-center lg:hidden' onClick={{}}>
                <IoSettings className=' ' />
                <span className='font-bold text-2xl'>Settings</span>
              </button>
              <button className='flex justify-between h-16 text-3xl items-center lg:hidden' onClick={logOut}>
                <CiLogout className='text-red-400' />
                <span className='font-bold text-2xl'>Logout</span>
              </button>
            </li>
            <li className='p-0 m-0 sm:hidden lg:block'>
              <a className="p-0" href="https://www.youtube-nocookie.com/embed/_e9yMqmXWo0?playlist=_e9yMqmXWo0&autoplay=1&iv_load_policy=3&loop=1&start="><img className={"w-72 p-0 rounded-md"} src="https://media1.tenor.com/m/Jc9jT66AJRwAAAAd/chipi-chipi-chapa-chapa.gif"></img></a>
            </li>
          </ul>
        </div>
      </div>

      <Modal id={"my_modal_1"} title={"Warning"} desc={"You didn't put anything in the add form."} />
      <Modal id={"not_signed_in"} title={"Error"} desc={"You have not logged in yet."} onClick={logOut} />
    </>
  );
}

export default App;
