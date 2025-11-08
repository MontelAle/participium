import { CreateMunicipalityUserDto, Role, User } from "@repo/api";

export type SidebarProps = {
    isOpen: boolean;
    onToggle: () => void;
}

export type AuthFormProps = React.ComponentProps<"div"> & {
    mode: "login" | "register"
};


export type AddUserDialogProps = {
  onCreate: (data: CreateMunicipalityUserDto) => Promise<User>;
  roles: Role[];
};

export type CreateMunicipalityUserFormProps = {
  onSubmit: (data: CreateMunicipalityUserDto) => Promise<User>;
  onCancel?: () => void;
  roles: Role[];
};
