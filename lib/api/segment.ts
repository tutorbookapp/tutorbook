import Analytics from 'analytics-node';

export default new Analytics(process.env.SEGMENT_WRITE_KEY as string);
