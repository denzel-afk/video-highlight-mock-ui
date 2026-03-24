export interface Moment {
    id: string;
    type: 'nature' | 'event' | 'emotion';
    thumbnail: string;
    description: string;
    videoUrl: string;
    timestamp: number; // timestamp of the moment in the video
}

export interface Video {
    id: string;
    title: string;
    description: string;
    moments: Moment[];
    duration: number; // total duration of the video in seconds
}