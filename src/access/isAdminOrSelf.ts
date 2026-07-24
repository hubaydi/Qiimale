import type { Access, FieldAccess } from "payload";

export const isAdminOrSelf: Access = ({ req: { user } }) => {
  // Need to be logged in
  if (user) {
    // If any other type of user, only provide access to themselves
    return {
      id: {
        equals: user.id,
      },
    };
  }

  // Reject everyone else
  return false;
};

export const isAdminOrSelfFieldLevel: FieldAccess = ({ id, req: { user } }) => {
  if (user?.id === id) {
    return true;
  }
  return false;
};
