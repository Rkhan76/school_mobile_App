export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolRoleId: string | null;
  mustChangePassword: boolean;
};

export type SchoolOption = { schoolId: string; schoolName: string };

export type LoginSuccess = {
  accessToken: string;
  refreshToken: string;
  user: User;
  school: { name: string };
  permissions: string[];
};

export type RequiresSchoolSelection = {
  requiresSchoolSelection: true;
  schools: SchoolOption[];
};

export type LoginResult = LoginSuccess | RequiresSchoolSelection;

export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  user: User;
  permissions: string[];
};

export function isRequiresSchoolSelection(r: LoginResult): r is RequiresSchoolSelection {
  return 'requiresSchoolSelection' in r && r.requiresSchoolSelection === true;
}
