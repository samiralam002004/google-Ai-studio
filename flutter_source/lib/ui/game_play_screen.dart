import 'package:flutter/material.dart';
import 'package:flame/game.dart';
import '../game/snake_game.dart';

class GamePlayScreen extends StatefulWidget {
  final String playerName;
  final Color playerColor;

  const GamePlayScreen({
    Key? key,
    required this.playerName,
    required this.playerColor,
  }) : super(key: key);

  @override
  State<GamePlayScreen> createState() => _GamePlayScreenState();
}

class _GamePlayScreenState extends State<GamePlayScreen> {
  late SnakeGameEngine _gameEngine;
  bool _isGameOver = false;
  int _finalScore = 0;

  @override
  void initState() {
    super.initState();
    _gameEngine = SnakeGameEngine(
      playerName: widget.playerName,
      playerColor: widget.playerColor,
      onGameOver: (score, kills) {
        setState(() {
          _isGameOver = true;
          _finalScore = score;
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // The interactive game canvas
          Positioned.fill(
            child: GameWidget(game: _gameEngine),
          ),

          // Custom Virtual Joystick overlay
          Positioned(
            bottom: 40,
            left: 40,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withOpacity(0.3)),
              ),
              child: Center(
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: Colors.cyanAccent,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
          ),

          // Boost button
          Positioned(
            bottom: 40,
            right: 40,
            child: GestureDetector(
              onTapDown: (_) {
                setState(() {
                  _gameEngine.isSpeedBoostActive = true;
                });
              },
              onTapUp: (_) {
                setState(() {
                  _gameEngine.isSpeedBoostActive = false;
                });
              },
              child: Container(
                width: 70,
                height: 70,
                decoration: const BoxDecoration(
                  color: Colors.redAccent,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(Icons.flash_on, color: Colors.white, size: 36),
                ),
              ),
            ),
          ),

          // Current Score HUD
          Positioned(
            top: 20,
            left: 20,
            child: SafeArea(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.star, color: Colors.amber, size: 18),
                    const SizedBox(width: 6),
                    Text(
                      "LENGTH: ${_gameEngine.player.score}",
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Exit button
          Positioned(
            top: 20,
            right: 20,
            child: SafeArea(
              child: IconButton(
                icon: const Icon(Icons.logout, color: Colors.white70),
                onPressed: () {
                  Navigator.pop(context);
                },
              ),
            ),
          ),

          // GAME OVER DIALOG OVERLAY
          if (_isGameOver)
            Positioned.fill(
              child: Container(
                color: Colors.black87,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.red.withOpacity(0.3)),
                    ),
                    maxWidth: 400,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.emoji_events, color: Colors.amber, size: 64),
                        const SizedBox(height: 16),
                        const Text(
                          "GAME OVER",
                          style: TextStyle(fontSize: 28, fontWeight: FontWeight.black, color: Colors.redAccent),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          "Aapki snake crash ho gayi hai!",
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _statBox("FINAL LENGTH", "$_finalScore"),
                            _statBox("COINS", "+${_finalScore ~/ 2}"),
                          ],
                        ),
                        const SizedBox(height: 32),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.amber,
                            foregroundColor: Colors.black,
                            minimumSize: const Size(double.infinity, 50),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () {
                            Navigator.pop(context);
                          },
                          child: const Text("EXIT TO MENU", style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _statBox(String title, String val) {
    return Column(
      children: [
        Text(title, style: const TextStyle(fontSize: 9, color: Colors.grey)),
        const SizedBox(height: 4),
        Text(val, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
      ],
    );
  }
}
