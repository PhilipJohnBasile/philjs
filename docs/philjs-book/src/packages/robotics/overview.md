
# Robotics (`@philjs/robotics`)

The bridge between Web and Metal.

## ROS Bridge
Native integration with the Robot Operating System.

```typescript
import { Robot } from '@philjs/robotics';

const arm = Robot.connect('ws://robot-arm.local');
arm.moveArm({ x: 10, y: 20, z: 50 });
```
