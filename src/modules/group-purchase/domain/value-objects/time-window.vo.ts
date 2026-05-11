export class TimeWindow {
  readonly startTime: Date;
  readonly endTime: Date;

  private constructor(startTime: Date, endTime: Date) {
    if (endTime <= startTime) throw new Error('End time must be after start time');
    this.startTime = startTime;
    this.endTime = endTime;
  }

  static create(startTime: Date, durationMinutes: number): TimeWindow {
    if (durationMinutes < 1) throw new Error('Duration must be at least 1 minute');
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    return new TimeWindow(startTime, endTime);
  }

  static reconstitute(startTime: Date, endTime: Date): TimeWindow {
    return new TimeWindow(startTime, endTime);
  }

  isExpired(now: Date = new Date()): boolean {
    return now >= this.endTime;
  }

  getRemainingMinutes(now: Date = new Date()): number {
    return Math.max(0, (this.endTime.getTime() - now.getTime()) / (60 * 1000));
  }
}
