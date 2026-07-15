import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flame/game.dart';
import 'package:flame/input.dart';

class SnakeSegment {
  double x;
  double y;
  SnakeSegment(this.x, this.y);
}

class Snake {
  final String id;
  final String name;
  final Color color;
  final bool isBot;
  List<SnakeSegment> segments;
  double angle;
  double speed;
  int score;
  bool isDead;
  double targetAngle;

  Snake({
    required this.id,
    required this.name,
    required this.color,
    required this.isBot,
    required double startX,
    required double startY,
  })  : segments = List.generate(10, (i) => SnakeSegment(startX - i * 8, startY)),
        angle = 0,
        speed = 1.8,
        score = 10,
        isDead = false,
        targetAngle = 0;
}

class Food {
  double x;
  double y;
  final int value;
  final Color color;
  Food(this.x, this.y, this.value, this.color);
}

class SnakeGameEngine extends FlameGame with PanDetector {
  static const double worldSize = 3000.0;
  late Snake player;
  List<Snake> bots = [];
  List<Food> foods = [];
  
  Offset cameraOffset = Offset.zero;
  Offset joystickDelta = Offset.zero;
  bool isSpeedBoostActive = false;

  final Function(int score, int kills) onGameOver;

  SnakeGameEngine({required String playerName, required Color playerColor, required this.onGameOver}) {
    player = Snake(
      id: 'player',
      name: playerName,
      color: playerColor,
      isBot: false,
      startX: worldSize / 2,
      startY: worldSize / 2,
    );
    _spawnBots();
    _spawnFood(500);
  }

  void _spawnBots() {
    final rand = Random();
    final names = ['SlitherPro', 'WormMax', 'VenomDart', 'CobraX', 'ViperRun', 'Anaconda', 'Pythonic'];
    final colors = [Colors.red, Colors.blue, Colors.green, Colors.purple, Colors.orange, Colors.pink, Colors.yellow];

    for (int i = 0; i < 15; i++) {
      bots.add(Snake(
        id: 'bot_$i',
        name: names[rand.nextInt(names.length)],
        color: colors[rand.nextInt(colors.length)],
        isBot: true,
        startX: rand.nextDouble() * worldSize,
        startY: rand.nextDouble() * worldSize,
      ));
    }
  }

  void _spawnFood(int count) {
    final rand = Random();
    final colors = [Colors.yellow, Colors.cyan, Colors.purpleAccent, Colors.emerald, Colors.redAccent];
    for (int i = 0; i < count; i++) {
      foods.add(Food(
        rand.nextDouble() * worldSize,
        rand.nextDouble() * worldSize,
        rand.nextInt(3) + 1,
        colors[rand.nextInt(colors.length)],
      ));
    }
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (player.isDead) return;

    _updatePlayerMovement();
    _updateBotsMovement();
    _handleCollisions();
    _maintainFoodDensity();
  }

  void _updatePlayerMovement() {
    if (joystickDelta != Offset.zero) {
      player.angle = atan2(joystickDelta.dy, joystickDelta.dx);
    }

    double currentSpeed = isSpeedBoostActive ? 3.6 : 1.8;
    double dx = cos(player.angle) * currentSpeed;
    double dy = sin(player.angle) * currentSpeed;

    // Shift segments
    for (int i = player.segments.length - 1; i > 0; i--) {
      player.segments[i].x = player.segments[i - 1].x;
      player.segments[i].y = player.segments[i - 1].y;
    }
    player.segments[0].x += dx;
    player.segments[0].y += dy;

    // Boundaries loop
    if (player.segments[0].x < 0) player.segments[0].x = worldSize;
    if (player.segments[0].x > worldSize) player.segments[0].x = 0;
    if (player.segments[0].y < 0) player.segments[0].y = worldSize;
    if (player.segments[0].y > worldSize) player.segments[0].y = 0;
  }

  void _updateBotsMovement() {
    final rand = Random();
    for (var bot in bots) {
      if (bot.isDead) continue;

      // Simple AI: Head towards nearest food
      Food? nearest;
      double minDist = 300.0;
      for (var f in foods) {
        double d = sqrt(pow(f.x - bot.segments[0].x, 2) + pow(f.y - bot.segments[0].y, 2));
        if (d < minDist) {
          minDist = d;
          nearest = f;
        }
      }

      if (nearest != null) {
        bot.targetAngle = atan2(nearest.y - bot.segments[0].y, nearest.x - bot.segments[0].x);
      } else if (rand.nextInt(100) < 3) {
        bot.targetAngle += (rand.nextDouble() - 0.5) * 2;
      }

      // Smooth angle rotation
      bot.angle += (bot.targetAngle - bot.angle) * 0.1;

      double dx = cos(bot.angle) * bot.speed;
      double dy = sin(bot.angle) * bot.speed;

      for (int i = bot.segments.length - 1; i > 0; i--) {
        bot.segments[i].x = bot.segments[i - 1].x;
        bot.segments[i].y = bot.segments[i - 1].y;
      }
      bot.segments[0].x += dx;
      bot.segments[0].y += dy;

      if (bot.segments[0].x < 0) bot.segments[0].x = worldSize;
      if (bot.segments[0].x > worldSize) bot.segments[0].x = 0;
      if (bot.segments[0].y < 0) bot.segments[0].y = worldSize;
      if (bot.segments[0].y > worldSize) bot.segments[0].y = 0;
    }
  }

  void _handleCollisions() {
    // 1. Eat food
    foods.removeWhere((food) {
      double d = sqrt(pow(food.x - player.segments[0].x, 2) + pow(food.y - player.segments[0].y, 2));
      if (d < 15.0) {
        player.score += food.value;
        player.segments.add(SnakeSegment(
          player.segments.last.x,
          player.segments.last.y,
        ));
        return true;
      }
      return false;
    });

    // 2. Snake vs Snake collision
    List<Snake> allSnakes = [player, ...bots];
    for (var s1 in allSnakes) {
      if (s1.isDead) continue;
      for (var s2 in allSnakes) {
        if (s1.id == s2.id || s2.isDead) continue;

        // Check if head of s1 hits body of s2
        for (int k = 1; k < s2.segments.length; k++) {
          double dist = sqrt(pow(s1.segments[0].x - s2.segments[k].x, 2) + 
                             pow(s1.segments[0].y - s2.segments[k].y, 2));
          if (dist < 12.0) {
            s1.isDead = true;
            _turnSnakeToFood(s1);
            if (s1.id == 'player') {
              onGameOver(player.score, 0);
            }
            break;
          }
        }
      }
    }
  }

  void _turnSnakeToFood(Snake s) {
    for (var seg in s.segments) {
      foods.add(Food(seg.x, seg.y, 2, s.color));
    }
  }

  void _maintainFoodDensity() {
    if (foods.length < 150) {
      _spawnFood(100);
    }
  }

  @override
  void onPanUpdate(DragUpdateInfo info) {
    joystickDelta = info.delta.global;
  }

  @override
  void onPanEnd(DragEndInfo info) {
    joystickDelta = Offset.zero;
  }
}
