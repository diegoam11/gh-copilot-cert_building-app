import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const badRequest = (message: string): never => {
    throw Object.assign(new Error(message), { status: 400 });
  };
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return badRequest('Activity details are required');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    return badRequest('Valid user, team, type, and positive minutes are required');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) return badRequest('User or team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const badRequest = (message: string): never => {
    throw Object.assign(new Error(message), { status: 400 });
  };
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return badRequest('Team details are required');
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim() ||
    !Array.isArray(members) ||
    !members.every((member) => typeof member === 'string' && Types.ObjectId.isValid(member))
  ) {
    return badRequest('Valid team name, mascot, and member IDs are required');
  }

  const memberIds = members as string[];
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== memberIds.length) {
    return badRequest('One or more team members were not found');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: existingMembers.map(({ _id }) => _id) });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1, 'team.name': 1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);
  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const activity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const workouts = await Workout.find({ focus: user.fitnessGoal }).sort({ title: 1 }).lean();
  const activityContext = activity ? `${activity.type} activity` : 'fitness goal';
  return workouts.map((workout) => ({
    ...workout,
    reason: `${activityContext} aligns with your ${user.fitnessGoal} goal`,
  }));
}

export { User };
