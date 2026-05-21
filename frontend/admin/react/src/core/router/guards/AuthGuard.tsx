import {Navigate, useLocation} from 'react-router-dom';
import React from "react";

interface AuthGuardProps {
    isAuthenticated: boolean;
    children: React.ReactNode;
    loginPath?: string;
}

export const AuthGuard = ({
                              isAuthenticated,
                              children,
                              loginPath = '/login'
                          }: AuthGuardProps) => {
    const location = useLocation();
    if (!isAuthenticated) {
        const redirect = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`${loginPath}?redirect=${redirect}`} replace/>;
    }
    return <>{children}</>;
};
