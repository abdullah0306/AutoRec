import {
  LucideProps,
  Loader2,
  LogIn,
  Moon,
  SunMedium,
  UserPlus,
  type Icon as LucideIcon,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { IconType } from "react-icons";


interface IconsType {
  logo: React.FC<LucideProps>;
  google: IconType;
  microsoft: typeof FcGoogle;
  spinner: typeof Loader2;
  sun: typeof SunMedium;
  moon: typeof Moon;
  login: typeof LogIn;
  register: typeof UserPlus;
}

export const Icons: IconsType = {
  logo: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
    </svg>
  ),
  google: FcGoogle,
  microsoft: FcGoogle,
  spinner: Loader2,
  sun: SunMedium,
  moon: Moon,
  login: LogIn,
  register: UserPlus,
};
