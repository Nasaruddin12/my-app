import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const InstagramApi = () => {
    const [authorizationUrl, setAuthorizationUrl] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [userId, setUserId] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [userMedia, setUserMedia] = useState([]);

    const location = useLocation();
    const navigate = useNavigate();

    const appId = '1658248854967355';
    const appSecret = '737fb75cd8d4ece011418aaeb8b5f772';
    const redirectUri = 'https://localhost:3000/';

    useEffect(() => {
        // Set authorization URL on component mount
        const buildAuthorizationUrl = () => {
            const getVars = new URLSearchParams({
                client_id: appId,
                redirect_uri: redirectUri,
                scope: 'user_profile,user_media',
                response_type: 'code'
            }).toString();

            setAuthorizationUrl(`https://api.instagram.com/oauth/authorize?${getVars}`);
        };

        buildAuthorizationUrl();
    }, []);

    useEffect(() => {
        // Handle OAuth callback
        const query = new URLSearchParams(window.location.search);
        const code = query.get('code');
        console.log(code)

        if (code) {
            fetchAccessToken(code);
        }
    }, [location.search]);

    const fetchAccessToken = async (code) => {
        const response = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: appId,
                client_secret: appSecret,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code
            })
        });
        const data = await response.json();

        if (data.access_token) {
            setAccessToken(data.access_token);
            setUserId(data.user_id);

            fetchUserProfile(data.access_token);
            fetchUserMedia(data.access_token);
        } else {
            console.error('Failed to get access token:', data);
        }
    };

    const fetchUserProfile = async (token) => {
        const response = await fetch(`https://graph.instagram.com/me?fields=id,username,media_count,account_type&access_token=${token}`);
        const data = await response.json();
        setUserProfile(data);
    };

    const fetchUserMedia = async (token) => {
        const response = await fetch(`https://graph.instagram.com/${userId}/media?fields=id,caption,media_type,media_url&access_token=${token}`);
        const data = await response.json();
        setUserMedia(data.data);
    };

    const handleLogout = () => {
        setAccessToken('');
        setUserProfile(null);
        setUserMedia([]);
        navigate('/');
    };

    return (
        <div>
            {!accessToken ? (
                <a href={authorizationUrl}>Login with Instagram</a>
            ) : (
                <div>
                    <button onClick={handleLogout}>Logout</button>
                    {userProfile && (
                        <div>
                            <h2>Profile</h2>
                            <p>ID: {userProfile.id}</p>
                            <p>Username: {userProfile.username}</p>
                            <p>Media Count: {userProfile.media_count}</p>
                            <p>Account Type: {userProfile.account_type}</p>
                        </div>
                    )}
                    <h2>Media</h2>
                    <ul>
                        {userMedia.map(media => (
                            <li key={media.id}>
                                <p>Caption: {media.caption}</p>
                                <p>Type: {media.media_type}</p>
                                {media.media_type === 'IMAGE' && <img src={media.media_url} alt={media.caption} />}
                                {media.media_type === 'VIDEO' && <video controls src={media.media_url} />}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default InstagramApi;
