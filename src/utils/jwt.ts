import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  data: { id: string };
  exp: number;
  iat: number;
}

export const decodeBakongToken = (token: string) => {
  const decoded = jwtDecode<JwtPayload>(token);
  const expiredAt = new Date(decoded.exp * 1000);

  return {
    id: decoded.data.id,
    expiredAt,
  };
};

export const isBakongTokenExpired = (token: string) => {
  const decoded = decodeBakongToken(token);

  return decoded.expiredAt < new Date();
};
