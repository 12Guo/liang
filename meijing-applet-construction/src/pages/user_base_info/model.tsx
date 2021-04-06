export default interface UserDetails {
    id: number;
    name: string;
    nickname: string;
    phone: string;
    avatar: string;
    divisionCode: string;
    divisionName: string;
    divisionStatus: string;
    departmentInfo: {
      id: number;
      name: string;
    };
    roles: [{
      code: string;
      name: string;
    }];
    permissions: [{
      code: string;
      name: string;
    }];
  }