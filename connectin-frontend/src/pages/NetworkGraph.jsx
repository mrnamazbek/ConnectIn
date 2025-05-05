import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { forceSimulation, forceLink, forceManyBody, forceCenter } from "d3-force-3d";
import axios from "../utils/axiosConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faUser, faCode, faLaptopCode } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";

// Note: Many JSX properties below are specific to Three.js/React Three Fiber
// and will trigger ESLint warnings about unknown props. This is normal for 3D components.

// --- Компонент для одного Узла ---
function Node({ node, position, onNodeClick, onNodeHover }) {
    const meshRef = useRef();
    const [isHovered, setIsHovered] = useState(false);

    // Цвета в зависимости от типа узла
    const color = useMemo(() => {
        switch (node.type) {
            case "user":
                return "#4299e1"; // Синий
            case "project":
                return "#48bb78"; // Зеленый
            case "skill":
                return "#f6ad55"; // Оранжевый
            default:
                return "#cbd5e0";
        }
    }, [node.type]);

    // Анимация при наведении
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1).multiplyScalar(isHovered ? 1.4 : 1), 0.1);
        }
    });

    return (
        <group
            position={position}
            onPointerOver={(e) => {
                e.stopPropagation();
                setIsHovered(true);
                onNodeHover(node);
            }}
            onPointerOut={() => {
                setIsHovered(false);
                onNodeHover(null);
            }}
            onClick={(e) => {
                e.stopPropagation();
                onNodeClick(node);
            }}
        >
            {/* Сфера узла */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} transparent opacity={0.9} />
            </mesh>
            {/* Подпись узла (появляется при наведении) */}
            <Suspense fallback={null}>
                <Text
                    position={[0, 0.5, 0]} // Над сферой
                    color={isHovered ? (node.type === "user" ? "#fff" : "#333") : "transparent"} // Показываем только при наведении
                    anchorX="center"
                    anchorY="middle"
                    fontSize={0.25} // Увеличенный размер шрифта
                    outlineWidth={0.02} // Более заметный контур
                    outlineColor="#000"
                    visible={isHovered} // Управляем видимостью
                >
                    {node.label}
                </Text>
            </Suspense>
        </group>
    );
}

// --- Компонент для Связи (Ребра) ---
function Edge({ edge, positions }) {
    const startPos = positions[edge.source];
    const endPos = positions[edge.target];

    // Не рендерим линию, если позиция одного из узлов еще не определена
    if (!startPos || !endPos) {
        return null;
    }

    // Преобразуем в векторы Three.js
    const startVec = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
    const endVec = new THREE.Vector3(endPos.x, endPos.y, endPos.z);

    return (
        <Line
            points={[startVec, endVec]}
            color="#999999" // Цвет линии
            lineWidth={1}
            transparent
            opacity={0.4} // Полупрозрачная
        />
    );
}

// --- Основной Компонент Графа ---
const GraphComponent = ({ graphData, onNodeClick, onNodeHover }) => {
    const nodesRef = useRef([]); // Ref для хранения узлов d3
    const simulationRef = useRef(); // Ref для симуляции d3
    const [positions, setPositions] = useState({}); // Состояние для позиций узлов

    // Инициализация и запуск симуляции d3-force-3d
    useEffect(() => {
        if (!graphData || !graphData.nodes || !graphData.edges) return;

        // Создаем копии для d3, чтобы не мутировать исходные данные
        const nodes = graphData.nodes.map((d) => ({ ...d }));
        const edges = graphData.edges.map((d) => ({ source: d.source, target: d.target })); // d3 нужны только source/target ID

        nodesRef.current = nodes; // Сохраняем узлы в ref

        // Создаем симуляцию
        const simulation = forceSimulation(nodes)
            // Сила притяжения по связям
            .force(
                "link",
                forceLink(edges)
                    .id((d) => d.id)
                    .distance(1.5)
                    .strength(0.5)
            )
            // Сила отталкивания между узлами
            .force("charge", forceManyBody().strength(-1.5)) // Отрицательное значение для отталкивания
            // Центрирующая сила (удерживает граф в центре)
            .force("center", forceCenter().strength(0.05))
            .alphaDecay(0.01) // Как быстро симуляция "остывает"
            .velocityDecay(0.4); // Трение

        simulationRef.current = simulation;

        // Функция, которая обновляет позиции в React состоянии на каждом тике симуляции
        const tick = () => {
            setPositions((prev) => {
                const newPositions = { ...prev };
                nodesRef.current.forEach((node) => {
                    // d3 добавляет координаты x, y, z к объектам узлов
                    newPositions[node.id] = { x: node.x || 0, y: node.y || 0, z: node.z || 0 };
                });
                return newPositions;
            });
        };

        simulation.on("tick", tick); // Вызываем tick на каждом шаге симуляции
        // simulation.on('end', () => console.log("D3 Simulation ended.")); // Можно отслеживать конец

        // Очистка при размонтировании
        return () => {
            simulation.stop();
        };
    }, [graphData]); // Перезапускаем симуляцию только при изменении данных графа

    // --- Рендеринг ---
    if (!graphData || !graphData.nodes) {
        return null; // Ничего не рендерим, если данных нет
    }

    return (
        <>
            {/* Рендерим связи */}
            {graphData.edges.map((edge, i) => (
                <Edge key={`edge-${i}`} edge={edge} positions={positions} />
            ))}
            {/* Рендерим узлы */}
            {graphData.nodes.map(
                (node) =>
                    // Рендерим узел только если его позиция рассчитана
                    positions[node.id] && <Node key={node.id} node={node} position={[positions[node.id].x, positions[node.id].y, positions[node.id].z]} onNodeClick={onNodeClick} onNodeHover={onNodeHover} />
            )}
        </>
    );
};

// --- Компонент для информационной карточки пользователя ---
const UserInfoCard = ({ userId, username }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/${userId}`);
                setUserData(response.data);
            } catch (err) {
                console.error("Failed to fetch user data:", err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, [userId]);
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    <FontAwesomeIcon icon={faUser} />
                </div>
                <div className="ml-3">
                    <h3 className="font-medium text-gray-800 dark:text-white">{username}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">User Profile</p>
                </div>
            </div>
            
            {loading ? (
                <div className="flex justify-center py-3">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500" />
                </div>
            ) : userData ? (
                <div className="text-sm">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="text-gray-600 dark:text-gray-400">Role:</div>
                        <div className="text-gray-800 dark:text-white">{userData.role || "Member"}</div>
                        
                        <div className="text-gray-600 dark:text-gray-400">Skills:</div>
                        <div className="text-gray-800 dark:text-white">
                            {userData.skills ? userData.skills.slice(0, 3).map(s => s.name).join(", ") : "No skills listed"}
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No additional info available</p>
            )}
            
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/profile/${userId}`, "_blank");
                }}
                className="w-full mt-3 py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
            >
                View Profile
            </button>
        </div>
    );
};

// --- Компонент для информационной карточки проекта ---
const ProjectInfoCard = ({ projectId, projectName }) => {
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${projectId}`);
                setProjectData(response.data);
            } catch (err) {
                console.error("Failed to fetch project data:", err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchProjectData();
    }, [projectId]);
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <FontAwesomeIcon icon={faLaptopCode} />
                </div>
                <div className="ml-3">
                    <h3 className="font-medium text-gray-800 dark:text-white">{projectName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Project Details</p>
                </div>
            </div>
            
            {loading ? (
                <div className="flex justify-center py-3">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-green-500" />
                </div>
            ) : projectData ? (
                <div className="text-sm">
                    <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {projectData.description || "No description available"}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="text-gray-600 dark:text-gray-400">Status:</div>
                        <div className="text-gray-800 dark:text-white">{projectData.status || "Active"}</div>
                        
                        <div className="text-gray-600 dark:text-gray-400">Members:</div>
                        <div className="text-gray-800 dark:text-white">{projectData.members_count || "0"}</div>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No additional info available</p>
            )}
            
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/project/${projectId}`, "_blank");
                }}
                className="w-full mt-3 py-1.5 px-3 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors"
            >
                View Project
            </button>
        </div>
    );
};

// --- Компонент для информационной карточки навыка ---
const SkillInfoCard = ({ skillName }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                    <FontAwesomeIcon icon={faCode} />
                </div>
                <div className="ml-3">
                    <h3 className="font-medium text-gray-800 dark:text-white">{skillName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Skill</p>
                </div>
            </div>
            
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/search?skill=${encodeURIComponent(skillName)}`, "_blank");
                }}
                className="w-full mt-3 py-1.5 px-3 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded transition-colors"
            >
                Find Related
            </button>
        </div>
    );
};

// --- Компонент-обертка с загрузкой данных и Canvas ---
const NetworkGraph = () => {
    const [graphData, setGraphData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null); // Обновлено для хранения всего узла, а не только ID
    const navigate = useNavigate();

    // Загрузка данных с бэкенда
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Используем ваш настроенный axios и эндпоинт
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/graph/connections`);
                if (response.data && response.data.nodes && response.data.edges) {
                    setGraphData(response.data);
                } else {
                    throw new Error("Invalid data format received from API");
                }
            } catch (err) {
                console.error("Failed to fetch graph data:", err);
                setError(err.message || "Could not load graph data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []); // Загружаем один раз при монтировании

    // Обработчики событий от узлов
    const handleNodeClick = (node) => {
        // Навигация в зависимости от типа узла
        if (node.type === "user") {
            // Извлекаем ID пользователя из строки "user_123"
            const userId = node.id.split("_")[1];
            navigate(`/profile/${userId}`);
        } else if (node.type === "project") {
            // Извлекаем ID проекта из строки "project_456"
            const projectId = node.id.split("_")[1];
            navigate(`/project/${projectId}`);
        } else if (node.type === "skill") {
            // Для навыков можно добавить перенаправление на страницу поиска
            navigate(`/search?skill=${encodeURIComponent(node.label)}`);
        }
    };

    const handleNodeHover = (node) => {
        setHoveredNode(node);
        // Можно менять стиль курсора и т.д.
        document.body.style.cursor = node ? "pointer" : "default";
    };

    // Функция для рендера соответствующей информационной карточки
    const renderInfoCard = () => {
        if (!hoveredNode) return null;
        
        let userId, projectId;
        
        switch (hoveredNode.type) {
            case "user":
                userId = hoveredNode.id.split("_")[1];
                return <UserInfoCard userId={userId} username={hoveredNode.label} />;
            case "project":
                projectId = hoveredNode.id.split("_")[1];
                return <ProjectInfoCard projectId={projectId} projectName={hoveredNode.label} />;
            case "skill":
                return <SkillInfoCard skillName={hoveredNode.label} />;
            default:
                return (
                    <div className="bg-black/70 text-white p-3 rounded-lg">
                        <div className="font-medium">{hoveredNode.label}</div>
                        <div className="text-xs text-gray-300 mt-1">Type: {hoveredNode.type}</div>
                    </div>
                );
        }
    };

    return (
        <div className="relative w-full rounded-lg overflow-hidden shadow-lg border dark:border-gray-700" style={{ height: "70vh", minHeight: "500px" }}>
            {/* Индикатор загрузки */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-20">
                    <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-emerald-500" />
                </div>
            )}
            {/* Сообщение об ошибке */}
            {!loading && error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-100/80 dark:bg-red-900/80 z-20 p-4">
                    <p className="text-red-700 dark:text-red-200 text-center">Error loading graph: {error}</p>
                </div>
            )}
            {/* 3D Canvas */}
            {!loading && !error && graphData && (
                <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
                    {/* Настройка камеры */}
                    {/* Освещение */}
                    <ambientLight intensity={0.8} />
                    <pointLight position={[20, 20, 20]} intensity={1.5} color="#ffffff" />
                    <pointLight position={[-20, -20, -10]} intensity={0.5} color="#a0e0ff" />
                    {/* Используем Suspense для асинхронных компонентов внутри (например, Text) */}
                    <Suspense fallback={null}>
                        <GraphComponent graphData={graphData} onNodeClick={handleNodeClick} onNodeHover={handleNodeHover} />
                    </Suspense>
                    {/* Управление камерой (вращение, зум, панорамирование) */}
                    <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
                </Canvas>
            )}
            {/* Инфо о наведенном узле - позиционирование и отображение соответствующей карточки */}
            {hoveredNode && (
                <div className="absolute bottom-4 right-4 z-10 animate-fade-in">
                    {renderInfoCard()}
                </div>
            )}
        </div>
    );
};

export default NetworkGraph;
