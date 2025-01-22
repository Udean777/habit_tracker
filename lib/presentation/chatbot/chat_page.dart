import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:the_habits/core/providers/chat_provider.dart';
import 'package:the_habits/presentation/chatbot/widgets/bottom_bar.dart';
import 'package:the_habits/presentation/chatbot/widgets/main_content.dart';
import 'package:the_habits/presentation/chatbot/widgets/sidebar.dart';
import 'dart:developer' as developer;

class ChatPage extends ConsumerStatefulWidget {
  const ChatPage({super.key});

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final TextEditingController _textController = TextEditingController();
  bool _isLoading = false;
  bool _isSidebarOpen = false;
  String _selectedModel = 'gemini-2.0-flash-exp';

  late final GenerativeModel model;

  @override
  void initState() {
    super.initState();
    final apiKey = dotenv.env['GEMINI_API_KEY'];
    developer.log('Initializing Gemini with API key: ${apiKey?.isNotEmpty}');

    model = GenerativeModel(
      model: 'gemini-2.0-flash-exp',
      apiKey: apiKey!,
    );

    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));
  }

  final List<Map<String, String>> _models = const [
    {'id': 'gemini-2.0-flash-exp', 'name': '2.0 Flash (Experimental)'},
    {'id': 'gemini-1.5-flash-8b', 'name': '1.5 Flash'},
  ];

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> sendMessage() async {
    if (_textController.text.trim().isEmpty) return;

    final userMessage = _textController.text;
    developer.log('Sending message: $userMessage');
    _textController.clear();

    setState(() {
      _isLoading = true;
    });

    try {
      final chat = model.startChat();
      developer.log('Started chat session');

      final response = await chat.sendMessage(Content.text(userMessage));
      developer.log('Received response: ${response.text}');

      final responseText = response.text ?? 'No response';

      if (mounted) {
        developer.log('Adding message to database');
        await ref.read(chatControllerProvider.notifier).addMessage(
              userMessage,
              responseText,
            );
        developer.log('Message added successfully');
      }
    } catch (e, stackTrace) {
      developer.log('Error in sendMessage: $e\n$stackTrace');
      if (mounted) {
        await ref.read(chatControllerProvider.notifier).addMessage(
              userMessage,
              'Error: $e',
            );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _onModelChanged(String? newModel) {
    if (newModel != null) {
      setState(() {
        _selectedModel = newModel;
      });
    }
  }

  Future<void> _handleNewChat() async {
    await ref.read(chatControllerProvider.notifier).createNewSession();
    setState(() {
      _isSidebarOpen = false;
    });
  }

  void _handleSelectSession(int sessionId) {
    ref.read(currentSessionIdProvider.notifier).state = sessionId;
    setState(() {
      _isSidebarOpen = false;
    });
  }

  Widget _buildAppBarTitle(ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(top: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'ChatBot (Gemini)',
            style: TextStyle(
              color: colorScheme.primary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          _buildModelDropdown(),
        ],
      ),
    );
  }

  Widget _buildModelDropdown() {
    return DropdownButton<String>(
      value: _selectedModel,
      onChanged: _onModelChanged,
      items: _models.map((model) {
        return DropdownMenuItem<String>(
          value: model['id'],
          child: Text(
            model['name']!,
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
        );
      }).toList(),
      style: const TextStyle(color: Colors.grey, fontSize: 14),
      icon: const Icon(Icons.keyboard_arrow_down, color: Colors.grey, size: 16),
      underline: Container(),
      dropdownColor: Colors.grey[900],
      isDense: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final chatSessions = ref.watch(chatSessionsProvider);
    final currentSessionId = ref.watch(currentSessionIdProvider);
    final currentSessionMessages = ref.watch(currentSessionMessagesProvider);

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        backgroundColor: Colors.grey[900],
        appBar: AppBar(
          elevation: 0,
          backgroundColor: Colors.transparent,
          actions: [
            IconButton(
              icon: const Icon(Icons.menu),
              onPressed: () => setState(() => _isSidebarOpen = !_isSidebarOpen),
            ),
          ],
          title: _buildAppBarTitle(colorScheme),
        ),
        body: chatSessions.when(
          data: (sessions) {
            // developer.log('Loaded sessions: ${DateTime.now()}');

            return Stack(
              children: [
                AnimatedPadding(
                  padding: EdgeInsets.only(left: _isSidebarOpen ? 300 : 0),
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                  child: currentSessionMessages.when(
                    data: (messages) => MainContent(
                      isLoading: _isLoading,
                      messages: messages,
                    ),
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (error, stack) =>
                        Center(child: Text('Error: $error')),
                  ),
                ),
                if (_isSidebarOpen)
                  Positioned(
                    left: 0,
                    top: 0,
                    bottom: 0,
                    child: Sidebar(
                      chatSessions: sessions,
                      currentSessionId: currentSessionId,
                      onNewChat: _handleNewChat,
                      onSelectSession: _handleSelectSession,
                      onDeleteSession: (sessionId) => ref
                          .read(chatControllerProvider.notifier)
                          .deleteSession(sessionId),
                    ),
                  ),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stack) {
            print(error);
            return Center(child: Text('Error: $error'));
          },
        ),
        bottomNavigationBar: BottomBar(
          isLoading: _isLoading,
          onSendMessage: sendMessage,
          textController: _textController,
        ),
      ),
    );
  }
}
