import asyncCreator from "../utils/aysncCreator.js";
import { ok } from "../utils/resHandler.js";
import User from "../DataModels/user.model.js";

export const savePushSubscription = asyncCreator(async (req, res) => {
  const { subscription } = req.body;
  await User.findByIdAndUpdate(req.user._id, {
    "preferences.pushSubscription": subscription,
  });
  return ok(res, null, "Push subscription saved");
});
