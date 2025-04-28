declare module "@/components/icons" {
  import { LucideProps } from "lucide-react";
  import { IconType } from "react-icons";
  
  export interface IconsType {
    logo: React.FC<LucideProps>;
    google: IconType;
    microsoft: LucideIcon;
    spinner: LucideIcon;
    sun: LucideIcon;
    moon: LucideIcon;
    login: LucideIcon;
    register: LucideIcon;
  }
  
  export const Icons: IconsType;
}
