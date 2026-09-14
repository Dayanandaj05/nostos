import { middleware } from "./middleware";

export async function proxy(request: any) {
  return middleware(request);
}

export { middleware };
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
