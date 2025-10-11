import Medication from "../DataModels/medication.model.js";
import DoseLog from "../DataModels/doselog.model.js";
import asyncCreator from "../utils/aysncCreator.js";
import { ok, created, badRequest, notFound } from "../utils/resHandler.js";

export const createMedication = asyncCreator(async (req, res) => {
  const { name, dosage, frequency, times, startDate, endDate } = req.body;

  if (!name || !dosage || !frequency || !times) {
    return badRequest(res, "All fields are required");
  }

  const medication = new Medication({
    user: req.user._id,
    name,
    dosage,
    frequency,
    times,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : null,
  });

  await medication.save();

  if (["daily", "weekly"].includes(frequency)) {
    const start = new Date(medication.startDate);
    const end = new Date(medication.endDate || start);
    const gap = frequency === "weekly" ? 7 : 1;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + gap)) {
      for (const time of times) {
        await DoseLog.create({
          medicationId: medication._id,
          user: req.user._id,
          date: new Date(d),
          time,
          status: "pending",
        });
      }
    }
  }

  return created(res, medication, "Medication created successfully.");
});

export const getMedications = asyncCreator(async (req, res) => {
  const meds = await Medication.find({ user: req.user._id });
  return ok(res, meds, "Medications fetched successfully.");
});

export const updateMedication = asyncCreator(async (req, res) => {
  const med = await Medication.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true }
  );

  if (!med) return notFound(res, "Medication not found.");
  return ok(res, med, "Medication updated successfully.");
});

export const deleteMedication = asyncCreator(async (req, res) => {
  const med = await Medication.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!med) return notFound(res, "Medication not found.");

  // Optionally delete dose logs too
  await DoseLog.deleteMany({ medicationId: med._id, user: req.user._id });

  return ok(res, null, "Medication deleted successfully.");
});
