import {createBrowserRouter} from "react-router";
import Register from "./features/auth/pages/Register";
import Login from "./features/auth/pages/Login";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";





export const router = createBrowserRouter([
    {
        path: "/login",
        element: < Login />
    },
    {
        path: "/register",
        element: < Register />
    },
    {
        path: "/",
        element: <Protected> <Home/> </Protected>
    },
    {
        path: "/interview/:interviewId",
        element: <Protected> <Home/> </Protected>
    }

])