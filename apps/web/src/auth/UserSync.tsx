import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { userProfile } from "./user-state";

export const UserSync = () => {
    const auth = useAuth();

    useEffect(() => {
        if (auth.isAuthenticated && auth.user) {
            console.log(auth);
            userProfile.value = {
                id: auth.user.profile.sub,
                name: auth.user.profile.name,
                email: auth.user.profile.email,
                ...auth.user.profile,
            };
        } else {
            userProfile.value = null;
        }
    }, [auth.isAuthenticated, auth.user]);

    return null;
};
