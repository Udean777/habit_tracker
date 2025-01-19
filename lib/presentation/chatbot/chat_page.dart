import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:the_habits/presentation/chatbot/models/chat_history.dart';
import 'package:the_habits/presentation/chatbot/models/chat_message.dart';
import 'package:the_habits/presentation/chatbot/models/chat_models.dart';
import 'package:the_habits/presentation/chatbot/repositories/chat_repository.dart';
import 'package:the_habits/presentation/chatbot/widgets/bottom_bar.dart';
import 'package:the_habits/presentation/chatbot/widgets/main_content.dart';
import 'package:the_habits/presentation/chatbot/widgets/sidebar.dart';
import 'package:uuid/uuid.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  /// Kontroler untuk field input teks.
  final TextEditingController _textController = TextEditingController();

  /// Daftar untuk menyimpan riwayat chat.
  final List<ChatHistory> _chatHistories = [];

  /// Riwayat chat yang saat ini dipilih.
  ChatHistory? _selectedChat;

  /// Flag untuk menunjukkan apakah proses loading sedang berlangsung.
  bool _isLoading = false;

  /// Flag untuk menunjukkan apakah sidebar terbuka.
  bool _isSidebarOpen = false;

  /// Repository untuk mengelola data chat.
  late final ChatRepository _chatRepository;

  /// Daftar model yang tersedia.
  final List<Map<String, String>> _models = [
    {
      'id': 'gemini-2.0-flash-exp',
      'name': '2.0 Flash (Experimental)',
    },
    {
      'id': 'gemini-1.5-flash-8b',
      'name': '1.5 Flash',
    },
  ];

  /// Model yang dipilih saat ini.
  String _selectedModel = 'gemini-2.0-flash-exp';

  /// Metode yang dipanggil saat widget dihapus dari tree widget.
  @override
  void dispose() {
    /// Menghapus kontroler teks saat widget dihapus dari tree widget.
    _textController.dispose();
    super.dispose();
  }

  /// Model generatif yang digunakan untuk respon chat.
  final model = GenerativeModel(
    model: 'gemini-2.0-flash-exp',
    apiKey: dotenv.env['GEMINI_API_KEY']!,
  );

  /// Sesi chat untuk chat saat ini.
  late final ChatSession chat;

  /// Metode yang dipanggil saat widget pertama kali dibuat.
  @override
  void initState() {
    super.initState();

    /// Inisialisasi repository chat dan memuat chat saat widget pertama kali dibuat.
    _initializeRepository();
    _initializeModel();
  }

  /// Metode untuk inisialisasi model.
  void _initializeModel() {}

  /// Metode yang dipanggil saat model berubah.
  /// [newModel] adalah model baru yang dipilih.
  /// Jika [newModel] tidak null, maka akan memanggil setState untuk memperbarui _selectedModel
  /// dan menginisialisasi ulang model dengan pilihan baru.
  void _onModelChanged(String? newModel) {
    if (newModel != null) {
      setState(() {
        _selectedModel = newModel;
        _initializeModel(); // Inisialisasi ulang model dengan pilihan baru
      });
    }
  }

  /// Inisialisasi repository chat dan memuat riwayat chat.
  ///
  /// Fungsi ini menginisialisasi objek `ChatRepository` dan memanggil metode `init`
  /// untuk mempersiapkan repository. Setelah itu, fungsi ini memuat riwayat chat
  /// dengan memanggil `_loadChats()`. Jika riwayat chat kosong, maka fungsi ini
  /// akan membuat chat baru dengan memanggil `_createNewChat()`. Jika tidak kosong,
  /// fungsi ini akan mengatur state dengan memilih chat pertama dari riwayat chat.
  Future<void> _initializeRepository() async {
    // Membuat instance baru dari ChatRepository
    _chatRepository = ChatRepository();

    // Memanggil metode init() untuk mempersiapkan repository
    await _chatRepository.init();

    // Memuat riwayat chat dengan memanggil _loadChats()
    await _loadChats();

    // Mengecek apakah riwayat chat kosong
    if (_chatHistories.isEmpty) {
      // Jika kosong, membuat chat baru dengan memanggil _createNewChat()
      _createNewChat();
    } else {
      // Jika tidak kosong, mengatur state dengan memilih chat pertama dari riwayat chat
      setState(() {
        _selectedChat = _chatHistories.first;
      });
    }
  }

  /// Memuat riwayat chat dari repository.
  ///
  /// Fungsi ini mengambil semua chat yang tersimpan dari repository
  /// dan memperbarui state dengan riwayat chat yang baru.
  ///
  /// - Mengambil semua chat yang tersimpan dari `_chatRepository`.
  /// - Menghapus semua riwayat chat yang ada di `_chatHistories`.
  /// - Menambahkan setiap chat yang diambil ke dalam `_chatHistories`
  ///   dengan mapping pesan-pesan yang ada di dalamnya.
  ///
  /// Fungsi ini bersifat asynchronous dan menggunakan `setState` untuk
  /// memperbarui UI setelah data diambil.
  Future<void> _loadChats() async {
    // Mengambil semua chat yang tersimpan dari repository secara asynchronous.
    final savedChats = await _chatRepository.getAllChats();

    // Memperbarui state dengan menggunakan setState.
    setState(() {
      // Menghapus semua riwayat chat yang ada di _chatHistories.
      _chatHistories.clear();

      // Melakukan iterasi pada setiap chat yang diambil dari repository.
      for (var savedChat in savedChats) {
        // Menambahkan setiap chat ke dalam _chatHistories dengan mapping pesan-pesan yang ada di dalamnya.
        _chatHistories.add(ChatHistory(
          id: savedChat.id, // Menetapkan id chat.
          title: savedChat.title, // Menetapkan judul chat.
          createdAt: savedChat.createdAt, // Menetapkan waktu pembuatan chat.
          messages: savedChat.messages
              .map((m) => ChatMessage(
                    content: m.content, // Menetapkan isi pesan.
                    isUserMessage: m
                        .isUserMessage, // Menetapkan apakah pesan dari pengguna.
                    timestamp: m.timestamp, // Menetapkan waktu pesan.
                  ))
              .toList(), // Mengubah hasil map menjadi daftar.
          model: model, // Menetapkan model chat.
        ));
      }
    });
  }

  /// Membuat riwayat chat baru dan menyimpannya ke repository.
  Future<void> _createNewChat() async {
    /// Membuat instance baru dari ChatHistory dengan ID unik, judul 'New Chat', waktu pembuatan saat ini, pesan kosong, dan model yang diberikan.
    final newChat = ChatHistory(
      id: const Uuid().v4(),
      title: 'New Chat',
      createdAt: DateTime.now(),
      messages: [],
      model: model,
    );

    /// Membuat instance baru dari ChatHistoryHive dengan ID, judul, waktu pembuatan, dan pesan kosong dari newChat.
    final newChatHive = ChatHistoryHive(
      id: newChat.id,
      title: newChat.title,
      createdAt: newChat.createdAt,
      messages: [],
    );

    /// Menyimpan newChatHive ke dalam repository chat.
    await _chatRepository.saveChat(newChatHive);

    /// Memperbarui state dengan menambahkan newChat ke dalam daftar _chatHistories dan mengatur _selectedChat menjadi newChat.
    setState(() {
      _chatHistories.add(newChat);
      _selectedChat = newChat;
    });
  }

  /// Mengirim pesan dan menangani respon dari model chat.
  Future<void> _sendMessage() async {
    // Jika teks pesan kosong atau tidak ada chat yang dipilih, keluar dari fungsi
    if (_textController.text.trim().isEmpty || _selectedChat == null) return;

    // Mengambil teks pesan dari text controller
    final userMessage = _textController.text;

    // Membuat objek pesan baru dari pengguna
    final newMessage = ChatMessage(
      content: userMessage,
      isUserMessage: true,
    );

    // Membuat objek pesan baru untuk disimpan di Hive
    final newMessageHive = ChatMessageHive(
      content: userMessage,
      isUserMessage: true,
      timestamp: DateTime.now(),
    );

    // Memperbarui state untuk menambahkan pesan baru dan mengatur loading
    setState(() {
      _selectedChat!.messages.add(newMessage);
      _isLoading = true;
      _textController.clear();

      // Jika ini adalah pesan pertama dalam chat, perbarui judul chat
      if (_selectedChat!.messages.length == 1) {
        _selectedChat!.title = userMessage.length > 30
            ? '${userMessage.substring(0, 30)}...'
            : userMessage;
        _chatRepository.updateChatTitle(
            _selectedChat!.id, _selectedChat!.title);
      }
    });

    // Menambahkan pesan baru ke chat di repository
    await _chatRepository.addMessageToChat(_selectedChat!.id, newMessageHive);

    try {
      // Mengirim pesan ke model chat dan menunggu respon
      final response =
          await _selectedChat!.chat.sendMessage(Content.text(userMessage));
      final responseText = response.text;

      if (mounted) {
        // Membuat objek pesan dari AI berdasarkan respon
        final aiMessage = ChatMessage(
          content: responseText ?? 'No response',
          isUserMessage: false,
        );

        // Membuat objek pesan dari AI untuk disimpan di Hive
        final aiMessageHive = ChatMessageHive(
          content: responseText ?? 'No response',
          isUserMessage: false,
          timestamp: DateTime.now(),
        );

        // Memperbarui state untuk menambahkan pesan dari AI dan mengatur loading
        setState(() {
          _selectedChat!.messages.add(aiMessage);
          _isLoading = false;
        });

        // Menambahkan pesan dari AI ke chat di repository
        await _chatRepository.addMessageToChat(
            _selectedChat!.id, aiMessageHive);
      }
    } catch (e) {
      if (mounted) {
        // Membuat objek pesan error jika terjadi kesalahan
        final errorMessage = ChatMessage(
          content: 'Error: $e',
          isUserMessage: false,
        );

        // Membuat objek pesan error untuk disimpan di Hive
        final errorMessageHive = ChatMessageHive(
          content: 'Error: $e',
          isUserMessage: false,
          timestamp: DateTime.now(),
        );

        // Memperbarui state untuk menambahkan pesan error dan mengatur loading
        setState(() {
          _selectedChat!.messages.add(errorMessage);
          _isLoading = false;
        });

        // Menambahkan pesan error ke chat di repository
        await _chatRepository.addMessageToChat(
            _selectedChat!.id, errorMessageHive);
      }
    }
  }

  /// Memilih riwayat chat dan menutup sidebar.
  void _selectChat(ChatHistory chatHistory) {
    setState(() {
      // Mengatur _selectedChat dengan mencari chatHistory yang memiliki id yang sama
      _selectedChat =
          _chatHistories.firstWhere((chat) => chat.id == chatHistory.id);
      // Menutup sidebar dengan mengatur _isSidebarOpen menjadi false
      _isSidebarOpen = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () {
              setState(() {
                _isSidebarOpen = !_isSidebarOpen;
              });
            },
          ),
          actions: const [
            Icon(Icons.more_horiz),
          ],
          title: Padding(
            padding: const EdgeInsets.only(
              top: 8.0,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'ChatBot (Gemini)',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                DropdownButton<String>(
                  value: _selectedModel,
                  onChanged: _onModelChanged,
                  items: _models.map((model) {
                    return DropdownMenuItem<String>(
                      value: model['id'],
                      child: Text(
                        model['name']!,
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 14,
                        ),
                      ),
                    );
                  }).toList(),
                  selectedItemBuilder: (context) {
                    return _models.map((model) {
                      return Center(
                        child: Text(
                          _models.firstWhere(
                              (m) => m['id'] == _selectedModel)['name']!,
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 14,
                          ),
                        ),
                      );
                    }).toList();
                  },
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 14,
                  ),
                  icon: const Icon(
                    Icons.keyboard_arrow_down,
                    color: Colors.grey,
                    size: 16,
                  ),
                  underline: Container(),
                  dropdownColor: Colors.grey[900],
                  isDense: true,
                ),
              ],
            ),
          ),
        ),
        body: Stack(
          children: [
            // Ini Main content
            AnimatedPadding(
              padding: EdgeInsets.only(left: _isSidebarOpen ? 200 : 0),
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              child: MainContent(
                isLoading: _isLoading,
                selectedChat: _selectedChat,
              ),
            ),
            // Ini Sidebar
            AnimatedPositioned(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              left: _isSidebarOpen ? 0 : -200,
              top: 0,
              bottom: 0,
              child: Container(
                width: 200,
                color: Colors.grey[900],
                child: Sidebar(
                  chatHistories: _chatHistories,
                  onCreateNewChat: _createNewChat,
                  onSelectChat: _selectChat,
                  selectedChat: _selectedChat,
                ),
              ),
            ),
          ],
        ),
        bottomNavigationBar: BottomBar(
          isLoading: _isLoading,
          onSendMessage: _sendMessage,
          textController: _textController,
        ),
      ),
    );
  }
}
