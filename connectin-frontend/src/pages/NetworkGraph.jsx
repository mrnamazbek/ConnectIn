import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { forceSimulation, forceLink, forceManyBody, forceCenter } from "d3-force-3d";
import axios from "../utils/axiosConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

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
            case "team":
                return "#a0aec0"; // Серый
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
                onNodeHover(node.id);
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
                    fontSize={0.18}
                    outlineWidth={0.01}
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

// --- Компонент-обертка с загрузкой данных и Canvas ---
const NetworkGraph3D = () => {
    const [graphData, setGraphData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null); // Для информации о наведенном узле

    // Загрузка данных с бэкенда
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Используем ваш настроенный axios и эндпоинт
                const response = await axios.get("/api/v1/graph/connections");
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
        console.log("Node clicked:", node);
        // TODO: Реализовать действие при клике (например, показать детали узла)
        alert(`Clicked on ${node.type}: ${node.label} (ID: ${node.id})`);
    };

    const handleNodeHover = (nodeId) => {
        setHoveredNodeId(nodeId);
        // Можно менять стиль курсора и т.д.
        document.body.style.cursor = nodeId ? "pointer" : "default";
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
            {/* Инфо о наведенном узле */}
            {hoveredNodeId && (
                <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 rounded text-xs">
                    Node: {hoveredNodeId}
                </div>
            )}
        </div>
    );
};

export default NetworkGraph3D;
