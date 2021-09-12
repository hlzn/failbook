import { makeAutoObservable, runInAction } from "mobx";
import agent from "../api/Agent";
import { Activity } from "../models/Activity";
import {v4 as uuid} from 'uuid';

export default class ActivityStore {
    activityRegistry = new Map<string, Activity>();
    selectedActivity: Activity | undefined = undefined;
    editMode = false;
    loading = false;
    loadingInitial = true;

    constructor() {
        makeAutoObservable(this)
    }

    get activitiesByDate() {
        return Array.from(this.activityRegistry.values()).sort((a, b) => 
            Date.parse(a.date) - Date.parse(b.date)
        );
    }

    loadActivities = async () => {
        try {
            const activitiesList = await agent.Activities.list();
            activitiesList.forEach((act)=> {
                act.date = act.date.split('T')[0];
                this.activityRegistry.set(act.id, act)
            });
            this.setLoadingInitial(false);
        } catch(error) {
            console.error(error);
            this.setLoadingInitial(false);
        }
    }

    setLoadingInitial = (state: boolean) => {
        this.loadingInitial = state;
    }

    selectActivity = (id: string) => {
        this.selectedActivity = this.activityRegistry.get(id);
    }

    cancelSelectedActivity = () => {
        this.selectedActivity = undefined;
    }

    openForm = (id?: string) => {
        id ? this.selectActivity(id) : this.cancelSelectedActivity();
        this.editMode = true;
    }

    closeForm = () => {
        this.editMode = false;
    }

    createActivity = async (activity: Activity) => {
        this.loading = true;
        activity.id = uuid();
        try {
            await agent.Activities.create(activity);
            runInAction(() => {
                this.activityRegistry.set(activity.id, activity);
                this.selectedActivity = activity;
                this.loading = false;
                this.editMode = false;
            })
        } catch(error){
            console.error(error);
            runInAction(() => {
                this.loading = false;
            })
        }
    }

    updateActivity = async (activity:Activity) => {
        this.loading = true;
        try {
            await agent.Activities.update(activity);
            runInAction(()=> {
                this.activityRegistry.set(activity.id, activity);
                this.selectedActivity = activity;
                this.editMode = false;
                this.loading = false;
            })
        } catch(error) {
            console.error(error);
            runInAction(() => {
                this.loading = false;
            })
        }
    }

    deleteActivity = async (id: string) => {
        this.loading = true;
        try {
            await agent.Activities.delete(id);
            runInAction(()=> {
                this.activityRegistry.delete(id);
                this.editMode = false;
                this.loading = false;
                this.cancelSelectedActivity();
            })
        } catch(error) {
            console.error(error);
            runInAction(() => {
                this.loading = false;
            })
        }
    }
}