import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../UserContext';
import { Redirect } from 'react-router-dom';
import io from 'socket.io-client';
import moment from 'moment';
let socket;
const Home = () => {
    const { user, setUser } = useContext(UserContext);
    const [rooms, setRooms] = useState([]);
    const [userList, setUserList] = useState([])

    const [messages, setMessages] = useState([]);


    const ENDPT = 'localhost:5000';
    useEffect(() => {
        socket = io(ENDPT);
        return () => {
            socket.emit('disconnect');
            socket.off();
        }
    }, [ENDPT])

    useEffect(() => {
        socket.on('output-rooms', rooms => {
            if (user && !user.isAdmin) {
                const index = rooms.findIndex(x => x.name == user._id)
                if (index === -1) {
                    socket.emit('create-room', user._id);
                }
                socket.emit('join', { name: user.name, room_id: user._id, user_id: user._id })
                socket.emit('get-messages-history', user._id)
            }
            setRooms(rooms)
        })
        if (user && user.isAdmin) {
            getUserList()
        }
    }, [messages])

    useEffect(() => {
        socket.on('message', newMessages => {
            const allMessage = [...messages, newMessages];
            setMessages(allMessage)
        })
    }, [messages])

    useEffect(() => {
        socket.on('output-messages', messages => {
            setMessages(messages)
        })
    }, [])
    useEffect(() => {
        socket.on('room-created', room => {
            setRooms([...rooms, room])
        })
    }, [rooms])


    const getUserList = async () => {
        try {
            const res = await fetch('http://localhost:5000/listUser', {
                method: 'get',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            console.log(data.user);
            if (data) {
                setUserList(data.user)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const notifyUser = async (e, data) => {
        e.preventDefault();
        socket.emit('join', { name: user.name, room_id: data._id, user_id: user._id })

        socket.emit('sendMessage', `${user.name} has viewed your profile`, data._id, () => console.log('sent message to', data._id))

        console.log("data notify", data);
    }
    if (!user) {
        return <Redirect to='/login' />
    }
    return (
        <div>
            <div className="row">
                {userList.length ?
                    <ul className="col s12 list-group">
                        {userList.map((x, i) => {
                            return (
                                <li key={i + 1 * 8} className="col s12  blue-grey darken-1 list-group-item" onClick={(e) => notifyUser(e, x)}>
                                    <div>{`view ${x.name}'s profile`}</div>
                                </li>
                            )
                        })}
                    </ul> : 
                    (user && user.isAdmin ? <ul className="col s12 list-group">
                        <li>No user's found</li>
                    </ul> : "")}
                <div className="col s12  offset-1">
                    {user && !user.isAdmin ? <div className="card-action">
                        {messages.length ?
                            <ul className="col s12 list-group">
                                {messages.map((x, i) => {
                                    return (
                                        <li key={i + 1 * 13} className="col s12  blue-grey darken-1 list-group-item">
                                            <div>{`${x.text}`} at {moment(x.createdAt).format("DD/MM/YYYY HH:MM:ss")}</div>
                                        </li>
                                    )
                                })}
                            </ul> : <ul className="col s12 list-group">
                                <li>No notification found</li>
                            </ul>}
                    </div> : ""}
                </div>
            </div>

        </div>
    )
}

export default Home
