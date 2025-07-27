interface JwtPayload {
    userId: string;
    roleId: string;
    role: string;
    exp: number;
    iat: number;
    jti: string;
}

export const decodeJwtToken = (token: string): JwtPayload => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        throw new Error('Invalid JWT token');
    }
};

export const isTokenExpired = (token: string): boolean => {
    try {
        const payload = decodeJwtToken(token);
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime;
    } catch (error) {
        return true; // Consider expired if we can't decode
    }
}; 