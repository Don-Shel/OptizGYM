export type TokenGetter = () => Promise<string | null>;

export const requireAuthToken = async (getToken: TokenGetter): Promise<string> => {
  let token = await getToken();
  if (!token) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    token = await getToken();
  }
  if (!token) {
    throw new Error('Your authenticated session is not ready. Please sign in again.');
  }
  return token;
};

export default requireAuthToken;

