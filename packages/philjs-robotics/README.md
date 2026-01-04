
# @philjs/robotics

ROS Bridge & Hardware Control.

## Features
- **ROS Integration**: Publish/Subscribe to ROS topics via WebSocket.
- **Inverse Kinematics**: Control robot arms with simple Cartesian coordinates.

## Usage
```typescript
import { Robot } from '@philjs/robotics';
const arm = Robot.connect('ws://localhost:9090');
arm.moveArm(10, 20, 50);
```
