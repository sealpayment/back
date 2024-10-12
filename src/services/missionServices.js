import Mission from "../models/missionModel.js";

export function createMission(mission) {
  try {
    const newMission = new Mission(mission);
    return newMission.save();
  } catch (error) {
    throw new Error("Error creating mission", error);
  }
}
